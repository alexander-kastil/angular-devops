- This is a simple sample to demonstrate Azure Static WebApps. It uses URL Rewriting in Angular. Click on "About", bookmark it and close and reopen the browser. Use your bookmark

- The app is using a mock `apiUrl` that is defined in environments.ts and whos value will be replaced by the Azure DevOps

- Examine `staticwebapp.config.json`. It contains the configuration for the Azure Static Web App. Here it sets `URL-rewriting` rules.

  ```json
  {
    "navigationFallback": {
      "rewrite": "/index.html",
      "exclude": ["/assets/*"]
    },
    "responseOverrides": {
      "404": {
        "rewrite": "/index.html",
        "statusCode": 200
      }
    }
  }
  ```
- Login to Azrue

  ```bash
  az login
  ```

- Create the Static Web App by execution `create-static-web-app.azcli`. You will use the deployment token later in your DevOps pipeline:

  ```bash
  az group create -n $grp -l $loc
  az staticwebapp create -n $app -g $grp
  token=$(az staticwebapp secrets list --name $app --query "properties.apiKey")
  ```

- Import `build-deploy-swa-ado.yml` into your Azure Devops tenant. It builds and deploys the app to Azure Static Web Apps. It uses the deployment token from the previous step.

  ```yaml
  name: Angular Static Website

  trigger:
    branches:
      include:
        - master

    paths:
      include:
        - app/ui/*

  pr: none

  pool:
    vmImage: "ubuntu-latest"

  variables:
    nodeVer: '18.10.0'
    buildfolder: az-static-webapp
    apploc: '<path-to-angular-app>'
    apiUrl: 'https://mockapi.azurewebsites.net'
    deploymentToken: '<enter-token-here>'

  stages:
  - stage: Build
    displayName: Build Angular

    jobs:
      - job: Build
        steps:
        - task: NodeTool@0
          inputs:
            versionSpec: $(nodeVer)
          displayName: Install Node $(nodeVer)

        - task: replacetokens@5
          displayName: Update Config
          inputs:
            rootDirectory: '$(System.DefaultWorkingDirectory)/$(apploc)'
            targetFiles: '**/*.prod.ts'
            encoding: 'auto'
            tokenPattern: 'doublebraces'
            writeBOM: true
            actionOnMissing: 'warn'
            keepToken: false
            actionOnNoFiles: 'continue'
            enableTransforms: false
            enableRecursion: false
            useLegacyPattern: false
            enableTelemetry: true

        - task: Cache@2
          inputs:
              key: '$(System.DefaultWorkingDirectory)/$(apploc)package-lock.json'
              path: '$(System.DefaultWorkingDirectory)/$(apploc)node_modules'
              cacheHitVar: 'npmCache'

        - script: npm install
          displayName: 'npm i'
          workingDirectory: $(apploc)
          condition: eq(variables['npmCache'],False)

        - script: npm run build-prod
          displayName: 'Build App'
          workingDirectory: $(apploc)

        - task: PublishBuildArtifacts@1
          inputs:
            PathtoPublish: $(apploc)dist/$(buildfolder)
            ArtifactName: 'ngapp'
            publishLocation: 'Container'
          displayName: 'Publish Artifacts'

  - stage: Deploy
    displayName: Deploy to static WA
    jobs:
      - job: Deploy
        steps:
          - checkout: self
            submodules: true
          - task: DownloadPipelineArtifact@2
            inputs:
              buildType: 'current'
          - task: AzureStaticWebApp@0
            inputs:
              workingDirectory: '$(Pipeline.Workspace)'
              app_location: 'ngapp'
              config_file_location: 'ngapp/assets/'
              skip_app_build: true
              skip_api_build: true
              azure_static_web_apps_api_token: '$(token)'
  ```
