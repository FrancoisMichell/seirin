import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordUtil {
  private static configService: ConfigService;

  static setConfigService(configService: ConfigService) {
    this.configService = configService;
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = PasswordUtil.getSaltRounds();
    return hash(password, saltRounds);
  }

  private static getSaltRounds() {
    return (
      this.configService.get<number>('security.bcryptSaltRounds') || SALT_ROUNDS
    );
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}
