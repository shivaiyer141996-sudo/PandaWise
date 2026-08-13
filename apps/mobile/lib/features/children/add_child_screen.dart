import 'package:flutter/material.dart';
import 'package:pandawise_mobile/core/api/pandawise_api.dart';
import 'package:pandawise_mobile/core/models/models.dart';
import 'package:pandawise_mobile/core/session/session_controller.dart';
import 'package:pandawise_mobile/core/theme/app_theme.dart';
import 'package:pandawise_mobile/core/widgets/pandawise_card.dart';

class AddChildScreen extends StatefulWidget {
  const AddChildScreen({required this.api, required this.session, super.key});

  final PandaWiseApi api;
  final SessionController session;

  @override
  State<AddChildScreen> createState() => _AddChildScreenState();
}

class _AddChildScreenState extends State<AddChildScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _name = TextEditingController();
  final TextEditingController _nickname = TextEditingController();
  final TextEditingController _interests = TextEditingController();
  late Future<BootstrapData> _bootstrap;

  DateTime? _dateOfBirth;
  String? _gender;
  String? _avatarId;
  String? _schoolId;
  String? _gradeId;
  String? _languageId;
  String? _timeCommitment;

  @override
  void initState() {
    super.initState();
    _bootstrap = widget.api.getBootstrapData();
  }

  @override
  void dispose() {
    _name.dispose();
    _nickname.dispose();
    _interests.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime now = DateTime.now();
    final DateTime? selected = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 7, now.month, now.day),
      firstDate: DateTime(now.year - 13, now.month, now.day),
      lastDate: DateTime(now.year - 3, now.month, now.day),
      helpText: 'Child’s date of birth',
    );
    if (selected != null) setState(() => _dateOfBirth = selected);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_dateOfBirth == null) {
      _showMessage('Select your child’s date of birth.');
      return;
    }
    final List<String> interests = _interests.text
        .split(',')
        .map((String value) => value.trim())
        .where((String value) => value.isNotEmpty)
        .take(5)
        .toList(growable: false);
    final String dob = '${_dateOfBirth!.year.toString().padLeft(4, '0')}-'
        '${_dateOfBirth!.month.toString().padLeft(2, '0')}-'
        '${_dateOfBirth!.day.toString().padLeft(2, '0')}';

    final bool created = await widget.session.createChild(
      CreateChildRequest(
        name: _name.text.trim(),
        nickname: _nickname.text.trim(),
        avatarId: _avatarId,
        dateOfBirth: dob,
        gender: _gender!,
        schoolId: _schoolId,
        gradeId: _gradeId,
        languageId: _languageId!,
        knownInterests: interests,
        parentTimeCommitment: _timeCommitment!,
      ),
    );
    if (!mounted) return;
    if (created) {
      Navigator.of(context).pop();
    } else {
      _showMessage(widget.session.error ?? 'Please try again.');
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Child')),
      body: FutureBuilder<BootstrapData>(
        future: _bootstrap,
        builder: (BuildContext context, AsyncSnapshot<BootstrapData> snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return _BootstrapError(
              onRetry: () =>
                  setState(() => _bootstrap = widget.api.getBootstrapData()),
            );
          }
          return _form(snapshot.data!);
        },
      ),
    );
  }

  Widget _form(BootstrapData data) {
    final List<MasterOption> languages = data.languages;
    final List<String> commitments = data.timeCommitments;
    if (languages.isEmpty ||
        commitments.isEmpty ||
        data.genders.isEmpty ||
        data.avatars.isEmpty ||
        data.schools.isEmpty ||
        data.grades.isEmpty) {
      return _BootstrapError(
        onRetry: () =>
            setState(() => _bootstrap = widget.api.getBootstrapData()),
      );
    }
    _gender = data.genders.contains(_gender) ? _gender : data.genders.first;
    _avatarId = data.avatars.any((MasterOption item) => item.id == _avatarId)
        ? _avatarId
        : data.avatars.first.id;
    _languageId = languages.any((MasterOption item) => item.id == _languageId)
        ? _languageId
        : languages.first.id;
    _timeCommitment = commitments.contains(_timeCommitment)
        ? _timeCommitment
        : commitments.first;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: <Widget>[
          PandaWiseCard(
            color: const Color(0xFFEFF6FF),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Choose an avatar',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  children: data.avatars
                      .map(
                        (MasterOption option) => _AvatarChoice(
                          value: option.id,
                          label: option.name,
                          selected: _avatarId!,
                          onSelected: _setAvatar,
                        ),
                      )
                      .toList(growable: false),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Child’s full name'),
            validator: (String? value) => (value?.trim().length ?? 0) < 2
                ? 'Enter your child’s name'
                : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _nickname,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Nickname (optional)'),
          ),
          const SizedBox(height: 12),
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: _selectDate,
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Date of birth'),
              child: Text(
                _dateOfBirth == null
                    ? 'Select date'
                    : '${_dateOfBirth!.day.toString().padLeft(2, '0')}/'
                        '${_dateOfBirth!.month.toString().padLeft(2, '0')}/${_dateOfBirth!.year}',
              ),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _gender,
            decoration: const InputDecoration(labelText: 'Gender'),
            items: data.genders
                .map(
                  (String value) => DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  ),
                )
                .toList(growable: false),
            onChanged: (String? value) => setState(() => _gender = value),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _schoolId ?? '',
            decoration: const InputDecoration(labelText: 'School (optional)'),
            items: <DropdownMenuItem<String>>[
              const DropdownMenuItem<String>(
                value: '',
                child: Text('Not selected'),
              ),
              ...data.schools.map(
                (MasterOption option) => DropdownMenuItem<String>(
                  value: option.id,
                  child: Text(option.name),
                ),
              ),
            ],
            onChanged: (String? value) => setState(
              () => _schoolId = value == null || value.isEmpty ? null : value,
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _gradeId ?? '',
            decoration: const InputDecoration(labelText: 'Grade (optional)'),
            items: <DropdownMenuItem<String>>[
              const DropdownMenuItem<String>(
                value: '',
                child: Text('Not selected'),
              ),
              ...data.grades.map(
                (MasterOption option) => DropdownMenuItem<String>(
                  value: option.id,
                  child: Text(option.name),
                ),
              ),
            ],
            onChanged: (String? value) => setState(
              () => _gradeId = value == null || value.isEmpty ? null : value,
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _languageId,
            decoration: const InputDecoration(labelText: 'Preferred language'),
            items: languages
                .map(
                  (MasterOption option) => DropdownMenuItem<String>(
                    value: option.id,
                    child: Text(option.name),
                  ),
                )
                .toList(growable: false),
            onChanged: (String? value) => setState(() => _languageId = value),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _interests,
            decoration: const InputDecoration(
              labelText: 'Known interests (optional)',
              helperText: 'Up to five, separated by commas',
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _timeCommitment,
            decoration: const InputDecoration(
              labelText: 'Family time commitment',
            ),
            items: commitments
                .map(
                  (String value) => DropdownMenuItem<String>(
                    value: value,
                    child: Text(_commitmentLabel(value)),
                  ),
                )
                .toList(growable: false),
            onChanged: (String? value) =>
                setState(() => _timeCommitment = value),
          ),
          const SizedBox(height: 24),
          PandaWiseLoadingButton(
            label: 'Save & Continue',
            onPressed: _submit,
            loading: widget.session.busy,
          ),
        ],
      ),
    );
  }

  void _setAvatar(String value) => setState(() => _avatarId = value);
}

class _AvatarChoice extends StatelessWidget {
  const _AvatarChoice({
    required this.value,
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  final String value;
  final String label;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      selected: value == selected,
      onSelected: (_) => onSelected(value),
      avatar: const Icon(Icons.pets_rounded, size: 18),
      label: Text(label),
    );
  }
}

class _BootstrapError extends StatelessWidget {
  const _BootstrapError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.cloud_off_rounded,
              size: 56,
              color: PandaWiseColors.warning,
            ),
            const SizedBox(height: 16),
            const Text(
              'We could not load the profile options. Please try again.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

String _commitmentLabel(String value) {
  final List<String> words = value.toLowerCase().split('_');
  if (words.length == 2 && words.last == 'min') {
    return '${words.first} minutes';
  }
  final String label = words.join(' ');
  return label.isEmpty
      ? value
      : '${label[0].toUpperCase()}${label.substring(1)}';
}
