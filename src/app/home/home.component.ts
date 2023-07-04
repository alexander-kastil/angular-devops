import { Component } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  apiUrl = environment.api;
  getMarkdown(): string {
    return "/assets/markdown/home.md";
  }
}
