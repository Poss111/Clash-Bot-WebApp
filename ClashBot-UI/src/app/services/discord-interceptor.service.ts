import {Injectable} from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from "@angular/common/http";
import {Observable} from "rxjs";
import {OAuthService} from "angular-oauth2-oidc";

@Injectable()
export class DiscordInterceptor implements HttpInterceptor {

  discordHostname = "discord.com/api"

  constructor(private oauthService: OAuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.includes(this.discordHostname)) {
      const Authorization = `Bearer ${this.oauthService.getAccessToken()}`;
      request = request.clone({setHeaders: {Authorization}});
    }
    return next.handle(request);
  }
}
