/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState } from 'react'
import { Link } from 'react-router'
import { PlusIcon } from '@heroicons/react/20/solid'
// helpers
import { getRecipeName } from '~/modules/ai-training/helpers/rl-runs-helper'
// views
import SimpleView from '~/components/views/SimpleView'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// alerts
import AlertInfo from '~/components/alerts/AlertInfo'
import AlertWarning from '~/components/alerts/AlertWarning'
// lists
import RLRunList from '~/modules/ai-training/components/lists/RLRunList'
// types
import type { RlRunSummary, TrainingRecipe } from '~/types/ai-training'

const PAGE_SIZE = 25

interface RLRunsViewProps {
  runs: RlRunSummary[]
  unavailableRecipeIds: string[]
  recipes: TrainingRecipe[]
  // Why some recipes are not offered
  recipesError?: string | null
}

const RLRunsView: React.FC<RLRunsViewProps> = ({
  runs,
  unavailableRecipeIds,
  recipes,
  recipesError,
}) => {
  const [recipeId, setRecipeId] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const filteredRuns = recipeId ? runs.filter((run) => run.recipeId === recipeId) : runs
  const visibleRuns = filteredRuns.slice(0, visibleCount)

  const newRunButton = (
    <Link
      to='/ai-training/rl/new'
      className='inline-flex items-center gap-x-1.5 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2'
    >
      <PlusIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
      New run
    </Link>
  )

  const recipeFilter = (
    <div>
      <label htmlFor='recipeFilter' className='sr-only'>
        Recipe
      </label>
      <select
        id='recipeFilter'
        value={recipeId}
        onChange={(e) => {
          setRecipeId(e.target.value)
          setVisibleCount(PAGE_SIZE)
        }}
        className='block w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-300 focus:outline-none focus:ring-blue-300'
      >
        <option value=''>All recipes</option>
        {recipes.map((recipe: TrainingRecipe) => (
          <option key={recipe.id} value={recipe.id}>
            {recipe.name}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <SimpleView title='Reinforcement Learning (RL)' headerActionButtons={newRunButton}>
      {recipesError && (
        <AlertWarning title='Some recipes are not available' className='mb-6'>
          {recipesError}
        </AlertWarning>
      )}
      {unavailableRecipeIds.length > 0 && (
        <AlertWarning title='Part of the run history could not be loaded' className='mb-6'>
          Runs of {unavailableRecipeIds.map((id) => getRecipeName(id, recipes)).join(', ')} are
          missing. New runs can still be started.
        </AlertWarning>
      )}
      <SimplePanel
        title='Latest runs'
        subtitle='Runs shared from this page, newest first. Clone one to start a new run with its settings.'
        actionsButtons={recipeFilter}
      >
        {filteredRuns.length === 0 ? (
          <AlertInfo title='No runs yet'>
            Runs launched from this page with sharing on appear here once their job has started,
            usually within half an hour. Start one with <strong>New run</strong>.
          </AlertInfo>
        ) : (
          <>
            <RLRunList runs={visibleRuns} recipes={recipes} />
            <div className='mt-4 flex items-center justify-between text-sm text-gray-500'>
              <span>
                {visibleRuns.length} of {filteredRuns.length} runs
              </span>
              {visibleRuns.length < filteredRuns.length && (
                <button
                  type='button'
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className='rounded-md bg-white px-3 py-1.5 font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                >
                  Show more
                </button>
              )}
            </div>
          </>
        )}
      </SimplePanel>
    </SimpleView>
  )
}

export default RLRunsView
