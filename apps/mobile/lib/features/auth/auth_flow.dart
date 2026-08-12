import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';
import 'package:pandawise_mobile/core/widgets/pando_brand.dart';

enum _AuthPage { login, signup, forgotPassword }

class AuthFlow extends StatefulWidget {
  const AuthFlow({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  State<AuthFlow> createState() => _AuthFlowState();
}

class _AuthFlowState extends State<AuthFlow> {
  _AuthPage _page = _AuthPage.login;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                children: <Widget>[
                  const PandoBrand(compact: true),
                  const SizedBox(height: 28),
                  PandaWiseCard(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: switch (_page) {
                        _AuthPage.login => _LoginForm(
                            key: const ValueKey<String>('login'),
                            session: widget.session,
                            onSignup: () => setState(() => _page = _AuthPage.signup),
                            onForgot: () =>
                                setState(() => _page = _AuthPage.forgotPassword),
                          ),
                        _AuthPage.signup => _SignupForm(
                            key: const ValueKey<String>('signup'),
                            session: widget.session,
                            onLogin: () => setState(() => _page = _AuthPage.login),
                          ),
                        _AuthPage.forgotPassword => _ForgotPasswordForm(
                            key: const ValueKey<String>('forgot'),
                            api: widget.api,
                            onBack: () => setState(() => _page = _AuthPage.login),
                          ),
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LoginForm extends StatefulWidget {
  const _LoginForm({
    required this.session,
    required this.onSignup,
    required this.onForgot,
    super.key,
  });

  final SessionController session;
  final VoidCallback onSignup;
  final VoidCallback onForgot;

  @override
  State<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<_LoginForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();
  bool _hidePassword = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final bool success = await widget.session.login(
      email: _email.text,
      password: _password.text,
    );
    if (!success && mounted) _showError(context, widget.session.error);
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text('Welcome back', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('Continue your child’s growth journey.', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 24),
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const <String>[AutofillHints.email],
            decoration: const InputDecoration(labelText: 'Email'),
            validator: _emailValidator,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _password,
            obscureText: _hidePassword,
            autofillHints: const <String>[AutofillHints.password],
            decoration: InputDecoration(
              labelText: 'Password',
              suffixIcon: IconButton(
                tooltip: _hidePassword ? 'Show password' : 'Hide password',
                onPressed: () => setState(() => _hidePassword = !_hidePassword),
                icon: Icon(_hidePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              ),
            ),
            validator: (String? value) => value == null || value.isEmpty ? 'Enter your password' : null,
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(onPressed: widget.onForgot, child: const Text('Forgot password?')),
          ),
          PandaWiseLoadingButton(
            label: 'Login',
            onPressed: _submit,
            loading: widget.session.busy,
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: widget.onSignup, child: const Text('Create a PandaWise account')),
        ],
      ),
    );
  }
}

class _SignupForm extends StatefulWidget {
  const _SignupForm({required this.session, required this.onLogin, super.key});

  final SessionController session;
  final VoidCallback onLogin;

  @override
  State<_SignupForm> createState() => _SignupFormState();
}

class _SignupFormState extends State<_SignupForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _name = TextEditingController();
  final TextEditingController _mobile = TextEditingController();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();
  String _parentType = 'Guardian';
  bool _terms = false;
  bool _marketing = false;

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_terms) {
      _showError(context, 'Please accept the Terms and Privacy Policy.');
      return;
    }
    final bool success = await widget.session.register(
      name: _name.text,
      parentType: _parentType,
      mobileNumber: _mobile.text,
      email: _email.text,
      password: _password.text,
      marketingConsent: _marketing,
    );
    if (!success && mounted) _showError(context, widget.session.error);
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text('Create account', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 20),
          TextFormField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Parent name'),
            validator: (String? value) => (value?.trim().length ?? 0) < 2 ? 'Enter your name' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _parentType,
            decoration: const InputDecoration(labelText: 'I am the child’s…'),
            items: const <String>['Mother', 'Father', 'Guardian', 'Grandparent']
                .map((String value) => DropdownMenuItem<String>(value: value, child: Text(value)))
                .toList(growable: false),
            onChanged: (String? value) => setState(() => _parentType = value ?? 'Guardian'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _mobile,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Mobile number'),
            validator: (String? value) => (value?.trim().length ?? 0) < 8 ? 'Enter a valid mobile number' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email'),
            validator: _emailValidator,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
            validator: (String? value) {
              if ((value?.length ?? 0) < 8) return 'Use at least 8 characters';
              if (!RegExp(r'[A-Z]').hasMatch(value!)) return 'Add an uppercase letter';
              if (!RegExp(r'\d').hasMatch(value)) return 'Add a number';
              return null;
            },
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _terms,
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text('I accept the Terms and Privacy Policy'),
            onChanged: (bool? value) => setState(() => _terms = value ?? false),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _marketing,
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text('Send me optional PandaWise updates'),
            onChanged: (bool? value) => setState(() => _marketing = value ?? false),
          ),
          PandaWiseLoadingButton(
            label: 'Register',
            onPressed: _submit,
            loading: widget.session.busy,
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: widget.onLogin, child: const Text('Already registered? Login')),
        ],
      ),
    );
  }
}

class _ForgotPasswordForm extends StatefulWidget {
  const _ForgotPasswordForm({required this.api, required this.onBack, super.key});

  final PandaWiseApi api;
  final VoidCallback onBack;

  @override
  State<_ForgotPasswordForm> createState() => _ForgotPasswordFormState();
}

class _ForgotPasswordFormState extends State<_ForgotPasswordForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _email = TextEditingController();
  bool _busy = false;
  bool _accepted = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await widget.api.requestPasswordReset(_email.text);
      if (mounted) setState(() => _accepted = true);
    } on PandaWiseApiException catch (exception) {
      if (mounted) _showError(context, exception.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text('Reset password', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            _accepted
                ? 'If an active account matches, reset instructions will be sent.'
                : 'Enter the email used for your PandaWise account.',
          ),
          const SizedBox(height: 20),
          if (!_accepted) ...<Widget>[
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: _emailValidator,
            ),
            const SizedBox(height: 16),
            PandaWiseLoadingButton(label: 'Continue', onPressed: _submit, loading: _busy),
          ],
          const SizedBox(height: 12),
          TextButton(onPressed: widget.onBack, child: const Text('Back to login')),
        ],
      ),
    );
  }
}

String? _emailValidator(String? value) {
  final String email = value?.trim() ?? '';
  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
    return 'Enter a valid email address';
  }
  return null;
}

void _showError(BuildContext context, String? message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message ?? 'Please try again.')),
  );
}
