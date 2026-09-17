import boxen from 'boxen';
import chalk from 'chalk';
import inquirer from 'inquirer';
import open from 'open';
import { Database } from 'sqlite';
import { AppConfig } from '../config';
import { Job } from '../types';
import { getQualifiedJobsForTriage, updateJobStatus } from '../db/database';
import { sendPitchEmail } from '../mailer/mailer';

export async function runCliTriage(db: Database, config: AppConfig): Promise<void> {
  console.log(chalk.bold.cyan('\n🎯 GetHired - Interactive Human-in-the-Loop Triage\n'));

  const jobs = await getQualifiedJobsForTriage(db);

  if (jobs.length === 0) {
    console.log(
      chalk.yellow('ℹ️  No qualified jobs waiting for triage right now.')
    );
    console.log(
      chalk.dim('Run `npm run discover` to scan job boards, ATS feeds, and LinkedIn.\n')
    );
    return;
  }

  console.log(chalk.green(`📋 Found ${jobs.length} qualified job(s) for review.\n`));

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const score = job.match_score || 0;
    const scoreColor = score >= 85 ? chalk.green.bold : chalk.yellow.bold;

    const details = [
      `${chalk.bold('🏢 Company:')} ${chalk.white.bold(job.company)}`,
      `${chalk.bold('💼 Role:')} ${chalk.cyan(job.title)}`,
      `${chalk.bold('🌍 Location:')} ${job.location_raw || 'Remote'}`,
      `${chalk.bold('🕒 Type:')} ${job.employment_type || 'Unspecified'}`,
      `${chalk.bold('💰 Compensation:')} ${
        job.salary_min
          ? `${job.currency || '$'}${job.salary_min.toLocaleString()} ${
              job.salary_max ? `- ${job.currency || '$'}${job.salary_max.toLocaleString()}` : ''
            } (${job.salary_period || 'year'})`
          : 'Undisclosed / Contract'
      }`,
      `${chalk.bold('🎯 Match Score:')} ${scoreColor(`${score}%`)}`,
      `${chalk.bold('✉️  Recruiter:')} ${
        job.recruiter_email ? chalk.blue(job.recruiter_email) : chalk.dim('None listed')
      }`,
      `${chalk.bold('🔗 Apply URL:')} ${chalk.dim(job.apply_url)}`,
    ];

    if (job.key_matching_skills && job.key_matching_skills.length > 0) {
      details.push(`${chalk.bold('⚡ Key Overlap:')} ${chalk.magenta(job.key_matching_skills.join(', '))}`);
    }

    if (job.tailored_pitch) {
      details.push('\n' + chalk.bold.underline('📝 Tailored Cold Pitch:'));
      details.push(chalk.italic(job.tailored_pitch));
    }

    const card = boxen(details.join('\n'), {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: score >= 85 ? 'green' : 'yellow',
      title: `[Lead ${i + 1} of ${jobs.length}]`,
      titleAlignment: 'center',
    });

    console.log(card);

    let stayOnJob = true;
    while (stayOnJob) {
      const choices: Array<{ name: string; value: string }> = [];

      if (job.recruiter_email) {
        choices.push({
          name: `✉️  Send Pitch Email with CV to ${job.recruiter_email}`,
          value: 'send_email',
        });
      }

      choices.push({
        name: `🌐 Open Job URL in Browser`,
        value: 'open_url',
      });

      choices.push({
        name: `📄 View Full Description`,
        value: 'view_desc',
      });

      choices.push({
        name: `⏭️  Skip Listing`,
        value: 'skip',
      });

      choices.push({
        name: `🚪 Exit Triage`,
        value: 'exit',
      });

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Choose action for this opportunity:',
          choices,
        },
      ]);

      if (action === 'send_email') {
        const { confirmSend } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmSend',
            message: `Are you sure you want to dispatch email to ${job.recruiter_email}?`,
            default: true,
          },
        ]);

        if (confirmSend) {
          console.log(chalk.blue('🚀 Sending email via SMTP...'));
          const sendResult = await sendPitchEmail(db, job, config);
          if (sendResult.success) {
            console.log(chalk.green(`✅ ${sendResult.message}\n`));
            stayOnJob = false;
          } else {
            console.log(chalk.red(`❌ ${sendResult.message}\n`));
          }
        }
      } else if (action === 'open_url') {
        console.log(chalk.blue(`🌐 Opening ${job.apply_url} in browser...`));
        await open(job.apply_url);

        const { appliedDirectly } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'appliedDirectly',
            message: 'Did you submit an application on the website?',
            default: false,
          },
        ]);

        if (appliedDirectly) {
          await updateJobStatus(db, job.id, 'applied');
          console.log(chalk.green('✅ Marked as applied in database.\n'));
          stayOnJob = false;
        }
      } else if (action === 'view_desc') {
        console.log(chalk.cyan.bold('\n--- Full Description ---'));
        console.log(chalk.white(job.description_text || 'No description available.'));
        console.log(chalk.cyan.bold('-------------------------\n'));
      } else if (action === 'skip') {
        await updateJobStatus(db, job.id, 'skipped');
        console.log(chalk.dim('⏭️  Listing marked as skipped.\n'));
        stayOnJob = false;
      } else if (action === 'exit') {
        console.log(chalk.cyan('👋 Exiting triage session. See you next time!'));
        return;
      }
    }
  }

  console.log(chalk.green.bold('🎉 You have reviewed all qualified leads for today!\n'));
}
