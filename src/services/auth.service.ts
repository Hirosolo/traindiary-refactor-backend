import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '@/repositories/user.repository';
import { signToken } from '@/lib/jwt';
import { SignupInput, LoginInput } from '@/validation/auth.schema';
import { sendVerificationEmail } from '@/lib/email';

export const AuthService = {
  async signup(input: SignupInput) {
    const existingUser = await UserRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Generate unique verification code
    let verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    let isUnique = false;
    while (!isUnique) {
      const existingUser = await UserRepository.findByVerificationCode(verificationCode);
      if (!existingUser) {
        isUnique = true;
      } else {
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const user = await UserRepository.create({
      email: input.email,
      passwordHash,
      fullname: input.fullname,
      phone: input.phone,
      verified: false,
      verificationCode,
      verificationToken,
      verificationExpiresAt,
    });

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyLink = `${appBaseUrl}/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(user.email, verificationCode, verifyLink);

    return {
      user: {
        id: user.user_id,
        email: user.email,
        fullname: user.username,
        phone: user.phone_number,
      },
      verificationRequired: true,
    };
  },

  async login(input: LoginInput) {
    const user = await UserRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.verified === false) {
      if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
        await UserRepository.deleteById(user.user_id);
        throw new Error('Verification expired. Please sign up again.');
      }
      throw new Error('Email not verified');
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
