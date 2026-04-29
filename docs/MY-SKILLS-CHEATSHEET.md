# Skills Cheatsheet — Referencia rápida

Escribe `/nombre-skill` en Claude Code para activarla.

---

## 🏗️ Planificación y arquitectura
| Comando | Qué hace |
|---------|----------|
| `/plan` | Crea plan de implementación paso a paso |
| `/feature-dev` | Flujo completo: plan → TDD → código → review |
| `/blueprint` | Diseño de arquitectura técnica |
| `/architecture-decision-records` | Documenta decisiones de arquitectura |
| `/prp-plan` | PRP (Product Requirements Plan) |

## ⚛️ Frontend — Next.js / React / TypeScript
| Comando | Qué hace |
|---------|----------|
| `/frontend-patterns` | Patrones React/Next.js (hooks, context, RSC) |
| `/nextjs-turbopack` | Guía Next.js 15/16 con Turbopack |
| `/design-system` | Crear/mantener sistema de diseño |
| `/frontend-design` | UI/UX con Tailwind, shadcn |
| `/ui-demo` | Generar demos de componentes |
| `/liquid-glass-design` | Efectos visuales modernos |

## 🔧 Backend — API / Server Actions / Prisma
| Comando | Qué hace |
|---------|----------|
| `/backend-patterns` | Server actions, API routes, middleware |
| `/database-migrations` | Migraciones Prisma paso a paso |
| `/postgres-patterns` | Queries, índices, optimización |
| `/api-design` | REST / tRPC / API design |
| `/deployment-patterns` | Deploy a Vercel, Railway, etc. |

## 🧪 Testing y calidad
| Comando | Qué hace |
|---------|----------|
| `/tdd` | TDD: escribe tests primero |
| `/tdd-workflow` | Flujo completo TDD (red→green→refactor) |
| `/e2e` | Tests E2E con Playwright |
| `/verification-loop` | Verifica que los cambios funcionan |
| `/quality-gate` | Checklist de calidad antes de merge |
| `/karpathy-guidelines` | Principios Karpathy: sin asumir, sin exceso |

## 🔍 Code Review y seguridad
| Comando | Qué hace |
|---------|----------|
| `/code-review` | Revisión de código general |
| `/security-review` | Audit de seguridad (OWASP, auth, SQL injection) |
| `/security-scan` | Scan rápido de vulnerabilidades |
| `/python-review` | Review específico Python |

## 🧹 Refactor y mantenimiento
| Comando | Qué hace |
|---------|----------|
| `/refactor-clean` | Eliminar código muerto |
| `/verify` | Verificar implementación |
| `/build-fix` | Resolver errores de build |
| `/prune` | Limpiar dependencias no usadas |

## 📝 Git y docs
| Comando | Qué hace |
|---------|----------|
| `/git-workflow` | Guía de commits, PRs, branches |
| `/prp-commit` | Commit message bien formateado |
| `/prp-pr` | Crear PR completo |
| `/update-docs` | Actualizar documentación |
| `/docs` | Generar docs del código |

## 🤖 Agentes especializados
| Comando | Qué hace |
|---------|----------|
| `/orchestrate` | Lanzar múltiples agentes en paralelo |
| `/multi-plan` | Plan con múltiples perspectivas |
| `/multi-frontend` | Agente paralelo para frontend |
| `/multi-backend` | Agente paralelo para backend |
| `/council` | Consenso multi-agente para decisiones |

## 💬 Reducir tokens (caveman)
| Comando | Qué hace |
|---------|----------|
| `/caveman` | Respuestas comprimidas (~75% menos tokens) |
| `/caveman lite` | Compresión suave |
| `/caveman ultra` | Máxima compresión |
| `/caveman-commit` | Commit messages ultra-concisos |
| `/caveman-review` | Code review conciso |

## 🔎 Investigación
| Comando | Qué hace |
|---------|----------|
| `/deep-research` | Investigación profunda de un tema |
| `/search-first` | Busca antes de implementar |
| `/repo-scan` | Analiza un repo externo |
| `/market-research` | Research de mercado / competidores |

## 💡 Misc útiles
| Comando | Qué hace |
|---------|----------|
| `/context-budget` | Gestiona el presupuesto de contexto |
| `/checkpoint` | Guarda punto de control de la sesión |
| `/save-session` | Guarda la sesión actual |
| `/resume-session` | Retoma sesión anterior |
| `/skill-health` | Ver estado de las skills |

---

## Agentes disponibles (se usan automáticamente)
Claude los invoca solo, pero puedes pedirlos:

| Agente | Cuándo se usa |
|--------|--------------|
| `planner` | Funciones complejas |
| `code-reviewer` | Después de escribir código |
| `tdd-guide` | Nuevas features / bug fixes |
| `typescript-reviewer` | Código TypeScript/JavaScript |
| `security-reviewer` | Auth, pagos, datos de usuario |
| `performance-optimizer` | Código lento o pesado |
| `database-reviewer` | Queries SQL, schemas |
| `refactor-cleaner` | Limpieza de código |
| `build-error-resolver` | Cuando el build falla |
| `e2e-runner` | Flujos críticos del usuario |
