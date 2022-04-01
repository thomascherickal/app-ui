import { useState, useEffect } from 'react';
import qs from 'query-string';
import { useLocation, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { validatePasswordComplexity, signup } from '@app/auth';
import {
  selectInvitationRequest,
  selectPendingInvitation,
  fetchInvitation,
} from '@app/invitations';
import {
  LOGIN_PATH,
  acceptInvitationWithCodeUrl,
  verifyEmailRequestUrl,
} from '@app/routes';
import { selectAuthLoader } from '@app/loaders';
import { validEmail } from '@app/string-utils';

import { AuthenticationWrapper } from '../auth/authentication-wrapper';
import { Progress } from '../auth/progress';
import { useLoaderSuccess } from '../use-loader-success';
import { LoggedInBanner } from '../auth/logged-in-banner';
import { FormGroup } from '../form-group';
import { InputFeedback } from '../input';
import { Button } from '../button';

const createQueryStringValue =
  (queryString: string) =>
  (key: string): string => {
    const values = qs.parse(queryString);
    const returnValue = values[key];

    if (returnValue && Array.isArray(returnValue)) {
      const [value] = returnValue;
      return value || '';
    }

    return returnValue || '';
  };

const SignupPageForm = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const getQueryStringValue = createQueryStringValue(location.search);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>(getQueryStringValue('email'));
  const [password, setPassword] = useState<string>('');

  const loader = useSelector(selectAuthLoader);
  const { isLoading } = loader;

  const invitationRequest = useSelector(selectInvitationRequest);
  const invitation = useSelector(selectPendingInvitation);

  const [challengeToken] = useState<string>(getQueryStringValue('token'));

  useEffect(() => {
    if (!invitation && invitationRequest.invitationId) {
      dispatch(fetchInvitation({ id: invitationRequest.invitationId }));
    }
  }, [invitationRequest.invitationId]);

  const currentEmail = invitation ? invitation.email : email;

  const emailErrorMessage =
    currentEmail === '' || validEmail(currentEmail)
      ? null
      : 'Not a valid email';

  const passwordErrors = validatePasswordComplexity(password);
  const passwordErrorMessage =
    password !== '' && passwordErrors.length > 0
      ? `Password ${passwordErrors.join(', ')}`
      : '';
  const disableSave =
    name === '' ||
    currentEmail === '' ||
    password === '' ||
    !!emailErrorMessage ||
    passwordErrors.length > 0;

  const onSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disableSave) {
      return;
    }

    dispatch(
      signup({
        name,
        email: invitation ? invitation.email : email,
        password,
        challenge_token: challengeToken,
      }),
    );
  };

  useLoaderSuccess(loader, () => {
    if (invitationRequest.invitationId) {
      navigate(acceptInvitationWithCodeUrl(invitationRequest));
    } else {
      navigate(verifyEmailRequestUrl());
    }
  });

  return (
    <form onSubmit={onSubmitForm}>
      <LoggedInBanner />
      <FormGroup>
        <label htmlFor="input-name" className="brand-dark-form__label">
          Your Name
        </label>
        <input
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoComplete="name"
          disabled={isLoading}
          autoFocus
          data-testid="input-name"
          id="input-name"
        />
      </FormGroup>
      <FormGroup variant={emailErrorMessage ? 'error' : 'default'}>
        <label htmlFor="input-email" className="brand-dark-form__label">
          Your email
        </label>
        <input
          name="email"
          type="email"
          value={invitation ? invitation.email : email}
          disabled={!!invitation || isLoading}
          onChange={(e) => setEmail(e.currentTarget.value)}
          autoComplete="username"
          data-testid="input-email"
          id="input-email"
        />
        <InputFeedback data-testid="email-error">
          {emailErrorMessage}
        </InputFeedback>
      </FormGroup>

      <FormGroup variant={passwordErrorMessage ? 'error' : 'default'}>
        <label htmlFor="input-password" className="brand-dark-form__label">
          Password
        </label>
        <input
          name="password"
          type="password"
          value={password}
          disabled={isLoading}
          onChange={(e) => setPassword(e.currentTarget.value)}
          autoComplete="current-password"
          data-testid="input-password"
          id="input-password"
        />
        <InputFeedback data-testid="password-error">
          {passwordErrorMessage}
        </InputFeedback>
      </FormGroup>

      <div className="flex flex-col justify-between mt-9 mb-6">
        <Button
          disabled={disableSave}
          type="submit"
          data-testid="signup-submit"
        >
          Create Account
        </Button>
      </div>
    </form>
  );
};

export const SignupPage = () => {
  const invitation = useSelector(selectPendingInvitation);

  let title: string;
  if (invitation) {
    title = `Sign up to join ${invitation.organizationName}`;
  } else {
    title = 'Sign up for Aptible';
  }

  return (
    <AuthenticationWrapper
      title={title}
      helpText="Already have an account?"
      link={{
        text: 'Log in',
        to: LOGIN_PATH,
      }}
      progressElement={<Progress steps={3} currentStep={1} />}
    >
      <SignupPageForm />
    </AuthenticationWrapper>
  );
};
