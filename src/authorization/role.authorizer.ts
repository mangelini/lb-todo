import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {Provider} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class RoleBasedAuthorizer implements Provider<Authorizer> {
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    const user: UserProfile = context.principals[0];
    const userRole = user.role;

    if (!metadata.allowedRoles) {
      return AuthorizationDecision.ALLOW;
    }

    if (metadata.allowedRoles.includes(userRole)) {
      return AuthorizationDecision.ALLOW;
    }

    return AuthorizationDecision.DENY;
  }
}
