import { Injectable } from '@nestjs/common';
import { AuthShareService } from '../authShare.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MethodGoogleService {
  constructor(
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
  ) {}
  async authenticationWithGoogle(idToken: string): Promise<any> {
    const payload = await this.authShareService.verifyGoogleToken(idToken);
    const userFind = await this.usersService.findByEmail(payload.email);

    const methods = userFind?.authMethods || [];

    if (!userFind?.authMethods?.includes('google')) {
      await this.usersService.createOrUpdateUser({
        findAttribute: 'email',
        findValue: payload.email,
        userData: {
          email: payload.email,
          first_name: userFind?.first_name || payload.given_name,
          last_name: userFind?.last_name || payload.family_name,
          image: userFind?.image || payload.picture,
          authMethods: [...methods, 'google'],
        },
        existingUser: userFind,
      });
    }

    const createPayload = {
      email: payload.email,
      firstName: userFind?.first_name || payload.given_name,
      lastName: userFind?.last_name || payload.family_name,
      phone: userFind?.phone_number,
      image: userFind?.image || payload.picture,
    };

    return {
      token: this.authShareService.createToken({ user: createPayload }),
      user: createPayload,
    };
  }
}
