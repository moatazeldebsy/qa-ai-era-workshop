import { conformanceTests } from '../../../platform/conformance.mjs';
import { create{{Name}}App } from '../src/app.js';

// The platform standards, checked on every change to {{name}}.
await conformanceTests('{{name}}', create{{Name}}App);
