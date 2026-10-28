/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { Link } from 'react-router'
import {
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
// helpers
import {
  formatDuration,
  getChangedHyperparameters,
  getCloneUrl,
  getEnvironmentName,
  getRunMetricLines,
  getJobUrl,
  getModelName,
  getPresetName,
  getRecipeName,
  isCurrentRecipeVersion,
  shortVersion,
} from '~/modules/ai-training/helpers/rl-runs-helper'
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
import { classNames } from '~/helpers/class-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
import RLRunStatusBadge from '~/modules/ai-training/components/badges/RLRunStatusBadge'
// types
import type { RlRunSummary, TrainingRecipe } from '~/types/ai-training'

// Changed values shown per run before the rest is summarised
const MAX_CHANGED_VALUES = 4
const MAX_METRICS = 4

const RunSummaryCell: React.FC<{ run: RlRunSummary }> = ({ run }) => {
  const duration = formatDuration(run.elapsedSeconds)
  return (
    <>
      <RLRunStatusBadge status={run.status} />
      <div className='mt-2 flex items-center text-xs text-gray-500'>
        <CalendarIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0' />
        <span className='truncate'>{run.startedOn ?? 'Unknown day'}</span>
      </div>
      {duration && (
        <div className='mt-1 flex items-center text-xs text-gray-500'>
          <ClockIcon aria-hidden='true' className='mr-1 h-4 w-4 flex-shrink-0' />
          <span className='truncate'>{duration}</span>
        </div>
      )}
      <div className='mt-1 truncate text-xs text-gray-500'>
        Job <span className='font-mono'>{run.jobId}</span> on {run.cluster}
      </div>
    </>
  )
}

// Links to the training code of the version when the recipe knows where it is
const VersionBadge: React.FC<{ version: string; isCurrent: boolean; url?: string }> = ({
  version,
  isCurrent,
  url,
}) => {
  const badge = (
    <LabelBadge
      color={isCurrent ? LabelColor.GRAY : LabelColor.YELLOW}
      className={classNames('font-mono', url ? 'hover:underline' : '')}
    >
      {shortVersion(version)}
      {!isCurrent && ' (older)'}
    </LabelBadge>
  )
  const title = `Blueprint version ${version}${isCurrent ? '' : ', older than the one new runs use'}`
  return url ? (
    <a href={url} target='_blank' rel='noopener noreferrer' title={`${title} (opens on GitHub)`}>
      {badge}
    </a>
  ) : (
    <span title={title}>{badge}</span>
  )
}

interface RunCellProps {
  run: RlRunSummary
  recipes: TrainingRecipe[]
}

const RecipeCell: React.FC<RunCellProps> = ({ run, recipes }) => {
  const presetName = getPresetName(run, recipes)
  const recipe = getRlRecipe(recipes, run.recipeId)
  const isCurrent = isCurrentRecipeVersion(run, recipe)
  const versionUrl = run.recipeVersion ? recipe?.getVersionUrl?.(run.recipeVersion) : undefined
  return (
    <>
      <div className='truncate font-medium text-gray-900'>
        {getRecipeName(run.recipeId, recipes)}
      </div>
      <div className='truncate text-xs text-gray-500'>
        {getModelName(run, recipes)} · {getEnvironmentName(run, recipes)}
      </div>
      <div className='mt-1 flex flex-wrap gap-1'>
        {presetName && <LabelBadge color={LabelColor.BLUE}>{presetName}</LabelBadge>}
        {run.recipeVersion && (
          <VersionBadge version={run.recipeVersion} isCurrent={isCurrent} url={versionUrl} />
        )}
      </div>
    </>
  )
}

const ParametersCell: React.FC<RunCellProps> = ({ run, recipes }) => {
  const changed = getChangedHyperparameters(run, recipes)
  const shown = changed.slice(0, MAX_CHANGED_VALUES)
  const hidden = changed.slice(MAX_CHANGED_VALUES)
  return (
    <>
      <div className='text-xs text-gray-700'>
        {run.nodes ?? '?'} nodes × {run.gpusPerNode ?? '?'} GPUs
        {run.timeLimit && <span className='text-gray-500'> · limit {run.timeLimit}</span>}
      </div>
      {changed.length === 0 ? (
        <div className='mt-1 text-xs text-gray-500'>Preset defaults</div>
      ) : (
        <ul className='mt-1 space-y-0.5'>
          {shown.map(({ key, label, value }) => (
            <li key={key} className='truncate text-xs' title={`${label} (${key}) = ${value}`}>
              <span className='text-gray-500'>{label}</span>{' '}
              <span className='font-mono text-gray-900'>{value}</span>
            </li>
          ))}
          {hidden.length > 0 && (
            <li
              className='text-xs text-gray-500'
              title={hidden.map(({ label, value }) => `${label} = ${value}`).join('\n')}
            >
              +{hidden.length} more changed
            </li>
          )}
        </ul>
      )}
    </>
  )
}

const OutcomeCell: React.FC<{ run: RlRunSummary }> = ({ run }) => {
  const lines = getRunMetricLines(run.metrics)
  const shown = lines.slice(0, MAX_METRICS)
  const hidden = lines.slice(MAX_METRICS)
  if (lines.length > 0) {
    return (
      <ul className='space-y-0.5'>
        {shown.map(({ key, label, value, title }) => (
          <li key={key} className='truncate text-xs' title={title ?? `${label} = ${value}`}>
            <span className='text-gray-500'>{label}</span>{' '}
            <span className='font-mono font-medium text-gray-900'>{value}</span>
          </li>
        ))}
        {hidden.length > 0 && (
          <li
            className='text-xs text-gray-500'
            title={hidden.map(({ label, value }) => `${label} = ${value}`).join('\n')}
          >
            +{hidden.length} more
          </li>
        )}
      </ul>
    )
  }
  if (run.status === 'running' && run.metricsIntervalSeconds) {
    return (
      <div
        className='text-xs text-gray-500'
        title={`This run reports its metrics every ${Math.round(run.metricsIntervalSeconds / 60)} minutes, once its first steps are logged`}
      >
        Pending data
      </div>
    )
  }
  const text: Record<RlRunSummary['status'], string> = {
    completed: 'Completed, no metrics recorded',
    failed: 'Failed before producing metrics',
    terminated: 'Stopped before producing metrics',
    preempted: 'Preempted by the scheduler before producing metrics',
    running: 'Still running',
    unknown: 'No result was recorded',
  }
  return <div className='text-xs text-gray-500 whitespace-normal'>{text[run.status]}</div>
}

const ACTION_CLASS_NAME =
  'inline-flex w-[5.5rem] items-center justify-center gap-x-1 rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'

const RunActions: React.FC<{ run: RlRunSummary }> = ({ run }) => (
  <div className='flex flex-col items-end gap-2'>
    <Link
      to={getJobUrl(run)}
      title={`Open job ${run.jobId} on ${run.cluster} (only jobs of your accounts can be opened)`}
      className={ACTION_CLASS_NAME}
    >
      <EyeIcon aria-hidden='true' className='h-4 w-4 text-gray-400' />
      Job
    </Link>
    {run.monitoringUrl && (
      <a
        href={run.monitoringUrl}
        target='_blank'
        rel='noopener noreferrer'
        title={`Open the run in Weights & Biases on ${new URL(run.monitoringUrl).host}`}
        className={ACTION_CLASS_NAME}
      >
        <ArrowTopRightOnSquareIcon aria-hidden='true' className='h-4 w-4 text-gray-400' />
        W&amp;B
      </a>
    )}
    <Link
      to={getCloneUrl(run)}
      title='Start a new run with the settings of this one'
      className={ACTION_CLASS_NAME}
    >
      <DocumentDuplicateIcon aria-hidden='true' className='h-4 w-4 text-gray-400' />
      Clone
    </Link>
  </div>
)

interface RLRunListProps {
  runs: RlRunSummary[]
  recipes: TrainingRecipe[]
}

const RLRunList: React.FC<RLRunListProps> = ({ runs, recipes }) => (
  <div className='overflow-x-auto'>
    <table className='w-full table-fixed text-left text-sm leading-6'>
      <colgroup>
        {/* Below lg only the run (with the rest stacked under it) and the action render */}
        <col className='w-[calc(100%-6.5rem)] lg:w-2/12' />
        <col className='hidden lg:table-column lg:w-3/12' />
        <col className='hidden lg:table-column lg:w-3/12' />
        <col className='hidden lg:table-column lg:w-2/12' />
        <col className='w-[6.5rem] lg:w-2/12' />
      </colgroup>
      <thead className='border-b border-gray-200 text-gray-900'>
        <tr>
          <th scope='col' className='py-3 pr-4 font-semibold'>
            Run
          </th>
          <th scope='col' className='hidden lg:table-cell py-3 pr-4 font-semibold'>
            Recipe
          </th>
          <th scope='col' className='hidden lg:table-cell py-3 pr-4 font-semibold'>
            Key parameters
          </th>
          <th scope='col' className='hidden lg:table-cell py-3 pr-4 font-semibold'>
            Performance
          </th>
          <th scope='col' className='py-3'>
            <span className='sr-only'>Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run: RlRunSummary) => (
          <tr key={`${run.recipeId}/${run.runId}`} className='border-b border-gray-100'>
            <td className='py-3 pr-4 align-top'>
              <RunSummaryCell run={run} />
              <div className='lg:hidden mt-3 space-y-3'>
                <div>
                  <RecipeCell run={run} recipes={recipes} />
                </div>
                <div>
                  <ParametersCell run={run} recipes={recipes} />
                </div>
                <div>
                  <OutcomeCell run={run} />
                </div>
              </div>
            </td>
            <td className='hidden lg:table-cell py-3 pr-4 align-top'>
              <RecipeCell run={run} recipes={recipes} />
            </td>
            <td className='hidden lg:table-cell py-3 pr-4 align-top'>
              <ParametersCell run={run} recipes={recipes} />
            </td>
            <td className='hidden lg:table-cell py-3 pr-4 align-top'>
              <OutcomeCell run={run} />
            </td>
            <td className='py-3 align-top text-right'>
              <RunActions run={run} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default RLRunList
