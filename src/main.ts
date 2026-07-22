import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

if (typeof window !== "undefined" && !/localhost/.test(window.location.hostname)) {
  enableProdMode();
}

bootstrapApplication(AppComponent).catch((error: unknown) => console.error(error));
