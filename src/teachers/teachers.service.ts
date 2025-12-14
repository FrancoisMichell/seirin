import { Injectable } from '@nestjs/common';

export type Teacher = {
  id: number;
  registry: string;
  password: string;
};

@Injectable()
export class TeachersService {
  private readonly teachers: Teacher[] = [
    {
      id: 1,
      registry: '123321',
      password: 'teste123',
    },
  ];

  findByRegistry(registry: string): Teacher | undefined {
    return this.teachers.find((teacher) => teacher.registry === registry);
  }

  validateCredentials(
    username: string,
    password: string,
  ): Omit<Teacher, 'password'> | null {
    const teacher = this.findByRegistry(username);
    if (!teacher || teacher.password !== password) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = teacher;
    return result;
  }
}
