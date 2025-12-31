import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  constructor(private configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.getSaltRounds();
    return hash(password, saltRounds);
  }

  private getSaltRounds(): number {
    return (
      this.configService.get<number>('security.bcryptSaltRounds') || SALT_ROUNDS
    );
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}
