import { getPlatformProxy } from 'wrangler';
import { Hono } from 'hono';
import webhooksRouter from './src/routes/webhooks';
import * as fs2 from 'fs';
import * as path from 'path';