/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nouvelle feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatage, sans changement de logique
        'refactor', // Refactoring sans bug fix ni feature
        'perf', // Optimisation perfs
        'test', // Tests
        'chore', // Maintenance, build, deps
        'ci', // CI/CD
        'revert', // Revert d'un commit
        'build', // Build system, deps
      ],
    ],
    'subject-case': [0], // Pas de casse imposee (franglish accepte)
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0], // Pas de limite stricte sur le body
  },
}

export default config
