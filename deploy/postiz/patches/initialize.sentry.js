"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSentry = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const initializeSentry = (appName, allowLogs = false) => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        return null;
    }
    try {
        const Sentry = tslib_1.__importStar(require("@sentry/nestjs"));
        const profiling_node_1 = require("@sentry/profiling-node");
        Sentry.init({
            initialScope: {
                tags: {
                    service: appName,
                    component: 'nestjs',
                },
                contexts: {
                    app: {
                        name: `Postiz ${(0, lodash_1.capitalize)(appName)}`,
                    },
                },
            },
            environment: process.env.NODE_ENV || 'development',
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            spotlight: process.env.SENTRY_SPOTLIGHT === '1',
            integrations: [
                (0, profiling_node_1.nodeProfilingIntegration)(),
                Sentry.consoleLoggingIntegration({ levels: ['log', 'info', 'warn', 'error', 'debug', 'assert', 'trace'] }),
                Sentry.openAIIntegration({
                    recordInputs: true,
                    recordOutputs: true,
                }),
            ],
            tracesSampleRate: 1.0,
            enableLogs: true,
            profileSessionSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.45,
            profileLifecycle: 'trace',
        });
    }
    catch (err) {
        console.log(err);
    }
    return true;
};
exports.initializeSentry = initializeSentry;
//# sourceMappingURL=initialize.sentry.js.map