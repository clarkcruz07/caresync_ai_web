export const Roles = {
  CAREGIVER: 'Caregiver',
  CARE_TEAM_LEADER: 'Care Team Leader',
  HOME_CARE_MANAGER: 'Home Care Manager',
  SUPER_ADMIN: 'Super Admin',
  FAMILY_MEMBER: 'Family Member',
}

export const RoleHomes = {
  [Roles.CAREGIVER]: '/caregiver',
  [Roles.CARE_TEAM_LEADER]: '/leader',
  [Roles.HOME_CARE_MANAGER]: '/manager',
  [Roles.SUPER_ADMIN]: '/admin',
  [Roles.FAMILY_MEMBER]: '/family',
}

