import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './config';
import { getDb, getStats } from './db/database';
import { runIngestion } from './scrapers/ingestionService';
import { evaluatePendingJobs } from './llm/evaluator';
import { runCliTriage } from './cli/triage';
import { testSmtpConnection } from './mailer/mailer';

const program = new Command();

program
  .name('get-hired')
  .description('Autonomous Remote Job Discovery & Application Copilot')
  .version('1.0.0');

// Command: discover
program
  .command('discover')
  .description('Run daily multi-channel discovery and LLM semantic evaluation')
  .option('-l, --limit <number>', 'Maximum number of jobs to evaluate with LLM', '10')
  .option('--no-eval', 'Skip LLM semantic evaluation step')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const db = await getDb(config.paths.sqliteDb);

      console.log(chalk.bold.green('\n🚀 Starting GetHired Discovery Pipeline...\n'));

      // 1. Scrape & Deterministic Pre-filter
      const report = await runIngestion(db, config);
      console.log(chalk.bold('\n📊 Ingestion Summary:'));
      console.log(`  • Raw Listings Scraped:    ${chalk.cyan(report.scrapedCount)}`);
      console.log(`  • Newly Discovered:        ${chalk.cyan(report.newCount)}`);
      console.log(`  • Filtered Out (Rules):    ${chalk.yellow(report.filteredOutCount)}`);
      console.log(`  • Passed Deterministic:    ${chalk.green(report.qualifiedCount)}\n`);

      // 2. LLM Semantic Evaluation
      if (options.eval) {
        const evalLimit = parseInt(options.limit, 10) || 10;
        const evaluated = await evaluatePendingJobs(db, config, evalLimit);
        console.log(chalk.green(`\n✨ Evaluated ${evaluated} jobs with LLM.\n`));
      }

      // 3. Stats & Next step
      const stats = await getStats(db);
      console.log(chalk.bold('📈 Current Database Overview:'));
      console.log(`  • Total in DB:   ${stats.total}`);
      console.log(`  • Qualified:     ${chalk.green(stats.qualified)}`);
      console.log(`  • Pending:       ${chalk.yellow(stats.pending)}`);
      console.log(`  • Applied:       ${chalk.blue(stats.applied)}`);
      console.log(`  • Skipped:       ${chalk.dim(stats.skipped)}\n`);

      if (stats.qualified > 0) {
        console.log(
          chalk.cyan.bold(
            `👉 Run ${chalk.white.bgCyan(' npm run triage ')} to review matches and send applications!`
          )
        );
      }
    } catch (err: any) {
      console.error(chalk.red('\n❌ Discovery pipeline encountered an error:'), err.message);
    }
  });

// Command: triage
program
  .command('triage')
  .description('Open interactive terminal triage to review qualified jobs and dispatch outreach')
  .action(async () => {
    try {
      const config = loadConfig();
      const db = await getDb(config.paths.sqliteDb);
      await runCliTriage(db, config);
    } catch (err: any) {
      console.error(chalk.red('\n❌ Triage encountered an error:'), err.message);
    }
  });

// Command: stats
program
  .command('stats')
  .description('Show database counts and application metrics')
  .action(async () => {
    try {
      const config = loadConfig();
      const db = await getDb(config.paths.sqliteDb);
      const stats = await getStats(db);

      console.log(chalk.bold.cyan('\n📊 GetHired Pipeline Metrics:\n'));
      console.log(`  • Total Tracked Listings:  ${chalk.white.bold(stats.total)}`);
      console.log(`  • Qualified (In Queue):    ${chalk.green.bold(stats.qualified)}`);
      console.log(`  • Pending LLM Evaluation:  ${chalk.yellow.bold(stats.pending)}`);
      console.log(`  • Successfully Applied:    ${chalk.blue.bold(stats.applied)}`);
      console.log(`  • Skipped / Disqualified:  ${chalk.dim(stats.skipped)}\n`);
    } catch (err: any) {
      console.error(chalk.red('\n❌ Error retrieving stats:'), err.message);
    }
  });

// Command: test-smtp
program
  .command('test-smtp')
  .description('Verify SMTP email connection settings from .env')
  .action(async () => {
    const config = loadConfig();
    console.log(chalk.cyan(`\nTesting SMTP connection to ${config.smtp.host}:${config.smtp.port}...`));
    const result = await testSmtpConnection(config);
    if (result.success) {
      console.log(chalk.green(`✅ ${result.message}\n`));
    } else {
      console.log(chalk.red(`❌ ${result.message}\n`));
    }
  });

// Default action when run without arguments
if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
