import { bootstrapApplication } from "@angular/platform-browser";
import { importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { provideZoneChangeDetection } from "@angular/core";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { tokenInterceptor } from "./app/interceptors/token.interceptor";

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    importProvidersFrom(FormsModule),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
  ],
});
