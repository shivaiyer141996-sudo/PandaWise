class ParentProfile {
  const ParentProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.subscriptionPlanId,
    required this.dailyTimeCommitment,
  });

  factory ParentProfile.fromJson(Map<String, dynamic> json) {
    return ParentProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      subscriptionPlanId: json['subscriptionPlanId'] as String,
      dailyTimeCommitment: json['dailyTimeCommitment'] as String,
    );
  }

  final String id;
  final String name;
  final String email;
  final String subscriptionPlanId;
  final String dailyTimeCommitment;
}

class ChildProfile {
  const ChildProfile({
    required this.id,
    required this.name,
    required this.dateOfBirth,
    required this.ageYears,
    required this.ageGroupId,
    required this.gender,
    required this.languageId,
    required this.assessmentStatus,
    required this.journeyStatus,
    required this.currentBadgeLevel,
    required this.currentStreak,
    this.nickname,
    this.avatarId,
    this.schoolId,
    this.gradeId,
    this.currentGrowScore,
  });

  factory ChildProfile.fromJson(Map<String, dynamic> json) {
    return ChildProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      nickname: json['nickname'] as String?,
      avatarId: json['avatarId'] as String?,
      dateOfBirth: json['dateOfBirth'] as String,
      ageYears: json['ageYears'] as int,
      ageGroupId: json['ageGroupId'] as String,
      gender: json['gender'] as String,
      schoolId: json['schoolId'] as String?,
      gradeId: json['gradeId'] as String?,
      languageId: json['languageId'] as String,
      assessmentStatus: json['assessmentStatus'] as String,
      journeyStatus: json['journeyStatus'] as String,
      currentGrowScore: (json['currentGrowScore'] as num?)?.toDouble(),
      currentBadgeLevel: json['currentBadgeLevel'] as String,
      currentStreak: json['currentStreak'] as int,
    );
  }

  final String id;
  final String name;
  final String? nickname;
  final String? avatarId;
  final String dateOfBirth;
  final int ageYears;
  final String ageGroupId;
  final String gender;
  final String? schoolId;
  final String? gradeId;
  final String languageId;
  final String assessmentStatus;
  final String journeyStatus;
  final double? currentGrowScore;
  final String currentBadgeLevel;
  final int currentStreak;

  String get displayName => nickname?.isNotEmpty == true ? nickname! : name;
}

class MasterOption {
  const MasterOption({required this.id, required this.name});

  factory MasterOption.fromJson(Map<String, dynamic> json) {
    return MasterOption(id: json['id'] as String, name: json['name'] as String);
  }

  final String id;
  final String name;
}

class BootstrapData {
  const BootstrapData({
    required this.ageGroups,
    required this.languages,
    required this.schools,
    required this.grades,
    required this.timeCommitments,
  });

  factory BootstrapData.fromJson(Map<String, dynamic> json) {
    List<MasterOption> options(String key) {
      return (json[key] as List<dynamic>? ?? <dynamic>[])
          .map((dynamic value) => MasterOption.fromJson(value as Map<String, dynamic>))
          .toList(growable: false);
    }

    return BootstrapData(
      ageGroups: options('ageGroups'),
      languages: options('languages'),
      schools: options('schools'),
      grades: options('grades'),
      timeCommitments: (json['timeCommitments'] as List<dynamic>? ?? <dynamic>[])
          .cast<String>(),
    );
  }

  final List<MasterOption> ageGroups;
  final List<MasterOption> languages;
  final List<MasterOption> schools;
  final List<MasterOption> grades;
  final List<String> timeCommitments;
}

class AuthResult {
  const AuthResult({required this.token, required this.parent});

  final String token;
  final ParentProfile parent;
}

class CreateChildRequest {
  const CreateChildRequest({
    required this.name,
    required this.dateOfBirth,
    required this.gender,
    required this.languageId,
    required this.parentTimeCommitment,
    this.nickname,
    this.avatarId,
    this.schoolId,
    this.gradeId,
    this.knownInterests = const <String>[],
  });

  final String name;
  final String? nickname;
  final String? avatarId;
  final String dateOfBirth;
  final String gender;
  final String? schoolId;
  final String? gradeId;
  final String languageId;
  final List<String> knownInterests;
  final String parentTimeCommitment;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name,
      if (nickname?.isNotEmpty == true) 'nickname': nickname,
      if (avatarId?.isNotEmpty == true) 'avatarId': avatarId,
      'dateOfBirth': dateOfBirth,
      'gender': gender,
      if (schoolId?.isNotEmpty == true) 'schoolId': schoolId,
      if (gradeId?.isNotEmpty == true) 'gradeId': gradeId,
      'languageId': languageId,
      'knownInterests': knownInterests,
      'parentTimeCommitment': parentTimeCommitment,
    };
  }
}
