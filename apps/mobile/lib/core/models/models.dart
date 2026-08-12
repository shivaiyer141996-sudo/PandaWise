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
  const MasterOption({
    required this.id,
    required this.name,
    this.category,
    this.ageGroupEligibility,
    this.colour,
    this.weight,
  });

  factory MasterOption.fromJson(Map<String, dynamic> json) {
    return MasterOption(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String?,
      ageGroupEligibility: json['ageGroupEligibility'] as String?,
      colour: json['colour'] as String?,
      weight: (json['weight'] as num?)?.toDouble(),
    );
  }

  final String id;
  final String name;
  final String? category;
  final String? ageGroupEligibility;
  final String? colour;
  final double? weight;
}

class BootstrapData {
  const BootstrapData({
    required this.ageGroups,
    required this.languages,
    required this.schools,
    required this.grades,
    required this.timeCommitments,
    this.skills = const <MasterOption>[],
    this.passions = const <MasterOption>[],
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
      skills: options('skills'),
      passions: options('passions'),
      timeCommitments: (json['timeCommitments'] as List<dynamic>? ?? <dynamic>[])
          .cast<String>(),
    );
  }

  final List<MasterOption> ageGroups;
  final List<MasterOption> languages;
  final List<MasterOption> schools;
  final List<MasterOption> grades;
  final List<MasterOption> skills;
  final List<MasterOption> passions;
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

class AssessmentOption {
  const AssessmentOption({required this.id, required this.text});

  factory AssessmentOption.fromJson(Map<String, dynamic> json) {
    return AssessmentOption(id: json['id'] as String, text: json['text'] as String);
  }

  final String id;
  final String text;
}

class AssessmentQuestion {
  const AssessmentQuestion({
    required this.id,
    required this.skillId,
    required this.text,
    required this.respondentType,
    required this.displayOrder,
    required this.options,
    this.selectedOptionId,
  });

  factory AssessmentQuestion.fromJson(Map<String, dynamic> json) {
    return AssessmentQuestion(
      id: json['id'] as String,
      skillId: json['skillId'] as String,
      text: json['text'] as String,
      respondentType: json['respondentType'] as String,
      displayOrder: json['displayOrder'] as int,
      options: (json['options'] as List<dynamic>)
          .map((dynamic value) => AssessmentOption.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
      selectedOptionId: json['selectedOptionId'] as String?,
    );
  }

  final String id;
  final String skillId;
  final String text;
  final String respondentType;
  final int displayOrder;
  final List<AssessmentOption> options;
  final String? selectedOptionId;
}

class AssessmentDetail {
  const AssessmentDetail({
    required this.id,
    required this.childId,
    required this.depth,
    required this.respondentMode,
    required this.status,
    required this.questionCount,
    required this.questions,
    required this.answeredCount,
  });

  factory AssessmentDetail.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> assessment = json['assessment'] as Map<String, dynamic>;
    final Map<String, dynamic> progress = json['progress'] as Map<String, dynamic>;
    return AssessmentDetail(
      id: assessment['id'] as String,
      childId: assessment['childId'] as String,
      depth: assessment['depth'] as String,
      respondentMode: assessment['respondentMode'] as String,
      status: assessment['status'] as String,
      questionCount: assessment['questionCount'] as int,
      questions: (json['questions'] as List<dynamic>)
          .map((dynamic value) => AssessmentQuestion.fromJson(value as Map<String, dynamic>))
          .toList(growable: false),
      answeredCount: progress['answered'] as int,
    );
  }

  final String id;
  final String childId;
  final String depth;
  final String respondentMode;
  final String status;
  final int questionCount;
  final List<AssessmentQuestion> questions;
  final int answeredCount;
}

class GrowScoreSkill {
  const GrowScoreSkill({
    required this.skillId,
    required this.name,
    required this.score,
    required this.bandLabel,
    required this.message,
    required this.colour,
  });

  factory GrowScoreSkill.fromJson(Map<String, dynamic> json) {
    return GrowScoreSkill(
      skillId: json['skillId'] as String,
      name: json['name'] as String,
      score: (json['score'] as num).toDouble(),
      bandLabel: json['bandLabel'] as String,
      message: json['message'] as String,
      colour: json['colour'] as String,
    );
  }

  final String skillId;
  final String name;
  final double score;
  final String bandLabel;
  final String message;
  final String colour;
}

class GrowScoreReport {
  const GrowScoreReport({
    required this.assessmentId,
    required this.growScore,
    required this.scoreBandLabel,
    required this.skills,
    required this.strengths,
    required this.recommendedFocusAreas,
    required this.lockedSkillCount,
  });

  factory GrowScoreReport.fromJson(Map<String, dynamic> json) {
    List<GrowScoreSkill> skills(String key) {
      return (json[key] as List<dynamic>)
          .map((dynamic value) => GrowScoreSkill.fromJson(value as Map<String, dynamic>))
          .toList(growable: false);
    }

    final Map<String, dynamic> assessment = json['assessment'] as Map<String, dynamic>;
    final Map<String, dynamic> entitlements = json['entitlements'] as Map<String, dynamic>;
    return GrowScoreReport(
      assessmentId: assessment['id'] as String,
      growScore: (json['growScore'] as num).toDouble(),
      scoreBandLabel: json['scoreBandLabel'] as String,
      skills: skills('skills'),
      strengths: skills('strengths'),
      recommendedFocusAreas: skills('recommendedFocusAreas'),
      lockedSkillCount: entitlements['lockedSkillCount'] as int,
    );
  }

  final String assessmentId;
  final double growScore;
  final String scoreBandLabel;
  final List<GrowScoreSkill> skills;
  final List<GrowScoreSkill> strengths;
  final List<GrowScoreSkill> recommendedFocusAreas;
  final int lockedSkillCount;
}
