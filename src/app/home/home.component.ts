import { Component } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  apiUrl = environment.apiUrl;
  getMarkdown(): string {
    return "/assets/markdown/home.md";
  }
}
