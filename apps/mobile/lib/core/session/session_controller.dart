import 'package:flutter/foundation.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/token_store.dart';

class SessionController extends ChangeNotifier {
  SessionController({required PandaWiseApi api, required TokenStore tokenStore})
      : _api = api,
        _tokenStore = tokenStore;

  final PandaWiseApi _api;
  final TokenStore _tokenStore;

  ParentProfile? _parent;
  List<ChildProfile> _children = <ChildProfile>[];
  String? _token;
  bool _initializing = true;
  bool _busy = false;
  String? _error;

  ParentProfile? get parent => _parent;
  List<ChildProfile> get children => List<ChildProfile>.unmodifiable(_children);
  bool get isAuthenticated => _token != null && _parent != null;
  bool get initializing => _initializing;
  bool get busy => _busy;
  String? get error => _error;

  Future<void> restore() async {
    if (!_initializing) return;
    final String? storedToken = await _tokenStore.read();
    if (storedToken != null) {
      try {
        _parent = await _api.getMe(storedToken);
        _children = await _api.getChildren(storedToken);
        _token = storedToken;
      } on Exception {
        await _tokenStore.clear();
      }
    }
    _initializing = false;
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) async {
    return _authenticate(() => _api.login(email: email, password: password));
  }

  Future<bool> register({
    required String name,
    required String parentType,
    required String mobileNumber,
    required String email,
    required String password,
    required bool marketingConsent,
  }) async {
    return _authenticate(
      () => _api.register(
        name: name,
        parentType: parentType,
        mobileNumber: mobileNumber,
        email: email,
        password: password,
        marketingConsent: marketingConsent,
      ),
    );
  }

  Future<bool> _authenticate(Future<AuthResult> Function() action) async {
    _setBusy(true);
    try {
      final AuthResult result = await action();
      _token = result.token;
      _parent = result.parent;
      _children = await _api.getChildren(result.token);
      await _tokenStore.write(result.token);
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<bool> createChild(CreateChildRequest request) async {
    final String? token = _token;
    if (token == null) return false;
    _setBusy(true);
    try {
      final ChildProfile child = await _api.createChild(token, request);
      _children = <ChildProfile>[..._children, child];
      _error = null;
      return true;
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      return false;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> refreshChildren() async {
    final String? token = _token;
    if (token == null) return;
    try {
      _children = await _api.getChildren(token);
      _error = null;
      notifyListeners();
    } on PandaWiseApiException catch (exception) {
      _error = exception.message;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _tokenStore.clear();
    _token = null;
    _parent = null;
    _children = <ChildProfile>[];
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }
}
