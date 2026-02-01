import bcrypt from 'bcryptjs';
import { UserRepository } from '@/repositories/user.repository';
import { signToken } from '@/lib/jwt';
import { SignupInput, LoginInput } from '@/validation/auth.schema';

export const AuthService = {
  async signup(input: SignupInput) {
    const existingUser = await UserRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await UserRepository.create({
      email: input.email,
      passwordHash,
      fullname: input.fullname,
      phone: input.phone,
    });

    const token = signToken({ userId: user.user_id, email: user.email });

    return {
      user: {
        id: user.user_id,
        email: user.email,
        fullname: user.username,
        phone: user.phone_number,
      },
      token,
    };
  },

  async login(input: LoginInput) {
    const user = await UserRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = signToken({ userId: user.user_id, email: user.email });

    return {
      user: {
        id: user.user_id,
        email: user.email,
      },
      token,
    };
  },
};
