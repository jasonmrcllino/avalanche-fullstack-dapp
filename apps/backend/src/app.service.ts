import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1>Simple Storage dApp API</h1>
        <p>Jason Marcellino Heldy - 231011400197</p>
        <hr />
        <p>Selamat datang di Backend API. Silakan buka dokumentasi untuk mencoba endpoint:</p>
        <a href="/documentation" style="background: #351df3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Buka API Documentation (Swagger)
        </a>
      </div>
    `;
  }
}
