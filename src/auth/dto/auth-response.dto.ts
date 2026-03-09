export class AuthResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    provider: string;
  };
}