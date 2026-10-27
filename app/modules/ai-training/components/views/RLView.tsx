/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'
import { Link } from 'react-router'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
// views
import SimpleView from '~/components/views/SimpleView'
// alerts
import AlertError from '~/components/alerts/AlertError'
import AlertWarning from '~/components/alerts/AlertWarning'
// forms
import RLTrainingForm from '~/modules/ai-training/components/forms/RLTrainingForm'
// types
import type { System } from '~/types/api-status'
import type { RlLaunchPrefill, TrainingRecipe } from '~/types/ai-training'

interface RLViewProps {
  formData: {
    systems: System[]
    username: string
  }
  recipes: TrainingRecipe[]
  // Why some recipes are not offered
  recipesError?: string | null
  // Settings of a published run to start from
  prefill?: RlLaunchPrefill
  // Why the run to start from couldn't be used
  cloneError?: string
  error: any
}

const RLView: React.FC<RLViewProps> = ({
  formData,
  recipes,
  recipesError,
  prefill,
  cloneError,
  error,
}: RLViewProps) => {
  const backLink = (
    <Link
      to='/ai-training/rl'
      className='inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
    >
      <ArrowLeftIcon aria-hidden='true' className='-ml-0.5 h-5 w-5 text-gray-400' />
      All runs
    </Link>
  )
  return (
    <SimpleView title='New RL run' headerActionButtons={backLink}>
      <AlertError error={error} />
      {recipesError && (
        <AlertWarning title='Some recipes are not available' className='mb-6'>
          {recipesError}
        </AlertWarning>
      )}
      {cloneError && (
        <AlertWarning title='Starting from scratch' className='mb-6'>
          {cloneError}
        </AlertWarning>
      )}
      {/* Keyed, so that cloning another run starts the form over */}
      <RLTrainingForm
        key={prefill ? `${prefill.recipeId}/${prefill.run.runId}` : 'new'}
        formData={formData}
        recipes={recipes}
        formError={error}
        prefill={prefill}
      />
    </SimpleView>
  )
}

export default RLView
