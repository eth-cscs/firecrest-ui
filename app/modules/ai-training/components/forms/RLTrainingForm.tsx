/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFetcher, useNavigation, useSubmit } from 'react-router'
import {
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderOpenIcon,
} from '@heroicons/react/20/solid'
// helpers
import { classNames } from '~/helpers/class-helper'
import { getFormErrorFieldsFromError } from '~/helpers/error-helper'
import { getHealthySchedulerSystems } from '~/helpers/system-helper'
import {
  DEFAULT_TIME_LIMIT,
  HYPERPARAMETER_FIELD_PREFIX,
  MONITORING_FIELD_PREFIX,
  buildTrainingScript,
  formatHyperparameterValue,
  getActiveHyperparameters,
  getDefaultHyperparameters,
  getDefaultJobName,
  getDefaultMonitoringValues,
  getHyperparameterPreset,
  isNodeCountConfigurable,
  parseHyperparameterValue,
  parseHyperparameters,
  resolveNodeCount,
  resolveMonitoring,
} from '~/modules/ai-training/helpers/rl-recipe-helper'
import {
  getDefaultTrainingWorkingDirectory,
  isOnHomeFileSystem,
} from '~/modules/ai-training/helpers/working-directory-helper'
// recipes
import { getRlRecipe } from '~/modules/ai-training/recipes/rl-recipes'
import { getRecipeName, shortVersion } from '~/modules/ai-training/helpers/rl-runs-helper'
import {
  getBlueprintRequestCard,
  getBlueprintRequestUrl,
} from '~/modules/ai-training/helpers/blueprint-request-helper'
import type { BlueprintRequestStep } from '~/modules/ai-training/helpers/blueprint-request-helper'
// apis
import { isMaintenancePayload } from '~/apis/api'
import type { MaintenancePayload } from '~/apis/api'
// types
import type { GetUserInfoResponse, Group, System } from '~/types/api-status'
import type {
  HyperparameterDefinition,
  HyperparameterPreset,
  HyperparameterValue,
  MonitoringDestination,
  MonitoringParameter,
  RlLaunchPrefill,
  TrainingRecipe,
} from '~/types/ai-training'
// forms
import {
  hasErrorForField,
  showInputValidation,
} from '~/components/forms/validations/ValidationForm'
import SelectableCardGroup, {
  RequestCard,
} from '~/modules/ai-training/components/forms/SelectableCardGroup'
// alerts
import AlertInfo from '~/components/alerts/AlertInfo'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// buttons
import LoadingButton from '~/components/buttons/LoadingButton'
// overlays
import BaseSlideOver from '~/components/overlays/BaseSliderOver'
// browsers
import RemoteFilesystemBrowser, {
  RemoteFilesystemBrowserMode,
} from '~/modules/filesystem/components/browsers/RemoteFilesystemBrowser'

interface RLTrainingFormData {
  systems: System[]
  username: string
}

interface RLTrainingFormProps {
  formData: RLTrainingFormData
  recipes: TrainingRecipe[]
  formError: any
  // Starts from the settings of a published run instead of an empty form
  prefill?: RlLaunchPrefill
  // GitHub owner/name of the blueprints, where requests and feedback go
  requestRepository: string
}

const inputClassName = (hasError: boolean) =>
  classNames(
    hasError
      ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
      : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
    'mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
  )

const toRawValues = (
  recipe: TrainingRecipe,
  values: Record<string, HyperparameterValue>,
  preset?: HyperparameterPreset,
) => {
  const rawValues: Record<string, string> = {}
  getActiveHyperparameters(recipe, preset).forEach((definition: HyperparameterDefinition) => {
    rawValues[definition.key] = formatHyperparameterValue(values[definition.key], definition.type)
  })
  return rawValues
}

const groupHyperparameters = (recipe: TrainingRecipe, preset?: HyperparameterPreset) => {
  const groups: Record<string, HyperparameterDefinition[]> = {}
  getActiveHyperparameters(recipe, preset).forEach((definition: HyperparameterDefinition) => {
    groups[definition.group] = [...(groups[definition.group] ?? []), definition]
  })
  return groups
}

const StepTitle: React.FC<{ step: number; title: string }> = ({ step, title }) => (
  <span className='flex items-center gap-x-3'>
    <span className='flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-sm font-medium text-white'>
      {step}
    </span>
    {title}
  </span>
)

const RLTrainingForm: React.FC<RLTrainingFormProps> = ({
  formData,
  recipes,
  formError,
  prefill,
  requestRepository,
}) => {
  const { systems, username } = formData
  const submit = useSubmit()
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'
  const formErrorFields = getFormErrorFieldsFromError(formError)
  const userInfoFetcher = useFetcher<GetUserInfoResponse | MaintenancePayload | null>()
  const partitionsFetcher = useFetcher<{ partitions: { name: string }[] }>()
  const reservationsFetcher = useFetcher<{ reservations: { name: string; state: string }[] }>()
  const schedulerSystems = useMemo(() => getHealthySchedulerSystems(systems) ?? [], [systems])

  // Selections start empty: each step is only shown once the previous one is valid
  // (or are taken from the run a new run starts from)
  const [recipeId, setRecipeId] = useState<string | null>(prefill?.recipeId ?? null)
  const [modelId, setModelId] = useState<string | null>(prefill?.modelId ?? null)
  const [environmentId, setEnvironmentId] = useState<string | null>(prefill?.environmentId ?? null)
  const recipe = recipeId ? getRlRecipe(recipes, recipeId) : undefined
  // A card at the end of each step for requesting more options or sending feedback
  const getRequestCard = (step: BlueprintRequestStep) => ({
    ...getBlueprintRequestCard(step),
    href: getBlueprintRequestUrl(requestRepository, step, recipe),
  })
  const model = recipe?.models.find((m) => m.id === modelId)
  const environment = recipe?.environments.find((e) => e.id === environmentId)

  // Recipes with presets (e.g. one per optimizer) have one chosen before the values are shown;
  // choosing a preset fills in its defaults.
  const [presetId, setPresetId] = useState<string | null>(prefill?.presetId ?? null)
  const preset = recipe ? getHyperparameterPreset(recipe, presetId) : undefined
  const isPresetSelected = !recipe?.hyperparameterPresets?.length || !!preset

  // Hyperparameters are kept as raw strings so that partially typed values can be edited freely;
  // `editedKeys` tracks user overrides, which survive switching to another model.
  const [hyperparameterValues, setHyperparameterValues] = useState<Record<string, string>>(
    prefill?.hyperparameterValues ?? {},
  )
  const [editedKeys, setEditedKeys] = useState<string[]>(prefill?.editedKeys ?? [])
  const defaultHyperparameters = recipe ? getDefaultHyperparameters(recipe, model, preset) : {}

  // Monitoring values are kept per destination, so switching back and forth doesn't lose them
  const [monitoringDestinationId, setMonitoringDestinationId] = useState<string | null>(
    prefill?.monitoringDestinationId ?? null,
  )
  const [monitoringValuesByDestination, setMonitoringValuesByDestination] = useState<
    Record<string, Record<string, string>>
  >(
    prefill?.monitoringDestinationId && prefill.monitoringValues
      ? { [prefill.monitoringDestinationId]: prefill.monitoringValues }
      : {},
  )
  const monitoringDestination = recipe?.monitoringDestinations.find(
    (d) => d.id === monitoringDestinationId,
  )
  const monitoringValues = monitoringDestination
    ? (monitoringValuesByDestination[monitoringDestination.id] ??
      getDefaultMonitoringValues(monitoringDestination))
    : {}
  // Kept across recipe changes: it is a choice about sharing, not about the recipe
  const [runTracking, setRunTracking] = useState(true)

  // Launch options
  const [system, setSystem] = useState<string>(schedulerSystems[0]?.name ?? '')
  const systemInfo = schedulerSystems.find((s: System) => s.name === system) ?? null
  const [account, setAccount] = useState<string>('')
  const [workingDirectory, setWorkingDirectory] = useState<string>('')
  const [jobName, setJobName] = useState<string>(() => {
    const prefillRecipe = prefill ? getRlRecipe(recipes, prefill.recipeId) : undefined
    const prefillModel = prefillRecipe?.models.find((m) => m.id === prefill?.modelId)
    return prefillRecipe && prefillModel ? getDefaultJobName(prefillRecipe, prefillModel) : ''
  })
  const [isJobNameEdited, setIsJobNameEdited] = useState(false)
  const [timeLimit, setTimeLimit] = useState<string>(
    prefill?.timeLimit ??
      (prefill ? getRlRecipe(recipes, prefill.recipeId)?.defaultTimeLimit : undefined) ??
      DEFAULT_TIME_LIMIT,
  )
  const [nodes, setNodes] = useState<string>(
    prefill?.nodes ?? String(getRlRecipe(recipes, prefill?.recipeId ?? '')?.nodes.default ?? ''),
  )
  const [partition, setPartition] = useState<string>('')
  const [reservation, setReservation] = useState<string>('')
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [isOpenWorkingDirectoryBrowse, setIsOpenWorkingDirectoryBrowse] = useState(false)

  useEffect(() => {
    if (!system) return
    userInfoFetcher.load(`/api/status/${system}/userinfo`)
    partitionsFetcher.load(`/api/status/${system}/partitions`)
    reservationsFetcher.load(`/api/status/${system}/reservations`)
    setAccount('')
    setPartition('')
    setReservation('')
    setWorkingDirectory(getDefaultTrainingWorkingDirectory(systemInfo, username))
  }, [system])

  const groups: Group[] =
    userInfoFetcher.data && !isMaintenancePayload(userInfoFetcher.data)
      ? (userInfoFetcher.data.groups ?? [])
      : []

  useEffect(() => {
    if (userInfoFetcher.state !== 'idle' || !userInfoFetcher.data) return
    if (isMaintenancePayload(userInfoFetcher.data)) return
    const userInfo = userInfoFetcher.data
    const defaultGroup =
      userInfo.groups?.find((group: Group) => group.default) ??
      userInfo.group ??
      userInfo.groups?.[0]
    setAccount(defaultGroup?.name ?? '')
  }, [userInfoFetcher.state, userInfoFetcher.data])

  const updateJobName = (nextRecipe: TrainingRecipe, nextModelId: string) => {
    const nextModel = nextRecipe.models.find((m) => m.id === nextModelId) ?? nextRecipe.models[0]
    if (!isJobNameEdited) setJobName(getDefaultJobName(nextRecipe, nextModel))
  }

  const handleRecipeSelect = (nextRecipeId: string) => {
    const nextRecipe = getRlRecipe(recipes, nextRecipeId)
    if (!nextRecipe || nextRecipe.id === recipeId) return
    setRecipeId(nextRecipe.id)
    setModelId(null)
    setEnvironmentId(null)
    setPresetId(null)
    setHyperparameterValues(toRawValues(nextRecipe, getDefaultHyperparameters(nextRecipe)))
    setEditedKeys([])
    setMonitoringDestinationId(null)
    setMonitoringValuesByDestination({})
    setNodes(String(nextRecipe.nodes.default))
    setTimeLimit(nextRecipe.defaultTimeLimit ?? DEFAULT_TIME_LIMIT)
    // The later steps are hidden again, so let their reveal scroll into view again
    maxVisibleStepRef.current = 1
  }

  const handleModelSelect = (nextModelId: string) => {
    const nextModel = recipe?.models.find((m) => m.id === nextModelId)
    if (!recipe || !nextModel) return
    setModelId(nextModel.id)
    const nextDefaults = toRawValues(
      recipe,
      getDefaultHyperparameters(recipe, nextModel, preset),
      preset,
    )
    setHyperparameterValues((values) => {
      const nextValues = { ...nextDefaults }
      editedKeys.forEach((key) => {
        nextValues[key] = values[key]
      })
      return nextValues
    })
    updateJobName(recipe, nextModel.id)
  }

  // A preset replaces all values, including edits made from the previous preset
  const handlePresetSelect = (nextPresetId: string) => {
    const nextPreset = recipe ? getHyperparameterPreset(recipe, nextPresetId) : undefined
    if (!recipe || !nextPreset) return
    setPresetId(nextPreset.id)
    setHyperparameterValues(
      toRawValues(recipe, getDefaultHyperparameters(recipe, model, nextPreset), nextPreset),
    )
    setEditedKeys([])
  }

  const handleHyperparameterChange = (key: string, value: string) => {
    setHyperparameterValues((values) => ({ ...values, [key]: value }))
    setEditedKeys((keys) => (keys.includes(key) ? keys : [...keys, key]))
  }

  const handleHyperparameterReset = (definition: HyperparameterDefinition) => {
    setHyperparameterValues((values) => ({
      ...values,
      [definition.key]: formatHyperparameterValue(
        defaultHyperparameters[definition.key],
        definition.type,
      ),
    }))
    setEditedKeys((keys) => keys.filter((k) => k !== definition.key))
  }

  const handleResetAllHyperparameters = () => {
    if (!recipe) return
    setHyperparameterValues(toRawValues(recipe, defaultHyperparameters, preset))
    setEditedKeys([])
  }

  const handleMonitoringChange = (key: string, value: string) => {
    if (!monitoringDestination) return
    setMonitoringValuesByDestination((valuesByDestination) => ({
      ...valuesByDestination,
      [monitoringDestination.id]: { ...monitoringValues, [key]: value },
    }))
  }

  // Client-side parsing mirrors the server-side validation, for inline errors and the preview
  const { values: parsedHyperparameters, errors: hyperparameterErrors } =
    recipe && isPresetSelected
      ? parseHyperparameters(recipe, hyperparameterValues, preset)
      : { values: {}, errors: {} as Record<string, string> }
  const monitoringErrors: Record<string, string> = {}
  const parsedMonitoringValues: Record<string, HyperparameterValue | null> = {}
  monitoringDestination?.parameters.forEach((parameter: MonitoringParameter) => {
    const result = parseHyperparameterValue(parameter, monitoringValues[parameter.key])
    if ('error' in result) {
      monitoringErrors[parameter.key] = result.error
    } else {
      parsedMonitoringValues[parameter.key] = result.value
    }
  })
  // Step n + 1 is shown once step n is valid; each check includes the previous ones
  const isModelStepValid = !!recipe && !!model
  const isEnvironmentStepValid = isModelStepValid && !!environment
  const isHyperparametersStepValid =
    isEnvironmentStepValid && isPresetSelected && Object.keys(hyperparameterErrors).length === 0
  const isMonitoringStepValid =
    isHyperparametersStepValid &&
    !!monitoringDestination &&
    Object.keys(monitoringErrors).length === 0
  const visibleStepCount =
    1 +
    [
      !!recipe,
      isModelStepValid,
      isEnvironmentStepValid,
      isHyperparametersStepValid,
      isMonitoringStepValid,
    ].filter(Boolean).length

  // Scroll a step into view the first time it appears, but not when it reappears after an edit
  // in an earlier step was fixed, so that editing doesn't make the page jump
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({})
  // A prefilled form shows its steps at once, without scrolling to them
  const maxVisibleStepRef = useRef(prefill ? 6 : 1)
  useEffect(() => {
    if (visibleStepCount > maxVisibleStepRef.current) {
      stepRefs.current[maxVisibleStepRef.current + 1]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
      maxVisibleStepRef.current = visibleStepCount
    }
  }, [visibleStepCount])
  const setStepRef = (step: number) => (element: HTMLDivElement | null) => {
    stepRefs.current[step] = element
  }

  const nodesResult =
    recipe && isPresetSelected && Object.keys(hyperparameterErrors).length === 0
      ? resolveNodeCount(recipe, parsedHyperparameters, nodes)
      : null
  const nodesError = nodesResult && 'error' in nodesResult ? nodesResult.error : undefined

  const script =
    isMonitoringStepValid &&
    recipe &&
    model &&
    environment &&
    monitoringDestination &&
    nodesResult &&
    'value' in nodesResult
      ? buildTrainingScript({
          recipe,
          model,
          environment,
          hyperparameters: parsedHyperparameters,
          preset,
          monitoring: resolveMonitoring(monitoringDestination, parsedMonitoringValues),
          jobOptions: { jobName, timeLimit, nodes: nodesResult.value },
          runTracking,
        })
      : null

  const workingDirectoryError = isOnHomeFileSystem(systemInfo, workingDirectory)
    ? 'Choose a directory outside home, e.g. on scratch: training writes checkpoints and logs there'
    : undefined
  const canLaunch =
    !!script &&
    !!system &&
    !!account &&
    !!workingDirectory &&
    !workingDirectoryError &&
    !isSubmitting

  const handleLaunch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canLaunch || !recipe || !model || !environment || !monitoringDestination) return
    const payload = new FormData()
    payload.set('recipeId', recipe.id)
    payload.set('modelId', model.id)
    payload.set('environmentId', environment.id)
    if (preset) payload.set('presetId', preset.id)
    Object.entries(hyperparameterValues).forEach(([key, value]) => {
      payload.set(`${HYPERPARAMETER_FIELD_PREFIX}${key}`, value)
    })
    payload.set('monitoringDestinationId', monitoringDestination.id)
    Object.entries(monitoringValues).forEach(([key, value]) => {
      payload.set(`${MONITORING_FIELD_PREFIX}${key}`, value)
    })
    payload.set('runTracking', String(runTracking))
    payload.set('system', system)
    payload.set('account', account)
    payload.set('workingDirectory', workingDirectory)
    payload.set('jobName', jobName)
    payload.set('timeLimit', timeLimit)
    payload.set('nodes', nodes)
    payload.set('partition', partition)
    payload.set('reservation', reservation)
    submit(payload, { method: 'post' })
  }

  const renderParameterInput = (
    definition: HyperparameterDefinition,
    fieldName: string,
    value: string,
    onChange: (value: string) => void,
    clientError: string | undefined,
  ) => {
    const hasError =
      !!clientError || hasErrorForField({ fieldName: fieldName, formErrorFields: formErrorFields })
    switch (definition.type) {
      case 'bool':
        return (
          <input
            id={fieldName}
            type='checkbox'
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className='mt-2 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500'
          />
        )
      case 'choice':
        return (
          <select
            id={fieldName}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClassName(hasError)}
          >
            {(definition.choices ?? []).map((choice: string) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        )
      default:
        return (
          <input
            id={fieldName}
            type='text'
            inputMode={
              definition.type === 'int'
                ? 'numeric'
                : definition.type === 'float'
                  ? 'decimal'
                  : definition.type === 'string' && definition.pattern?.startsWith('https?')
                    ? 'url'
                    : 'text'
            }
            value={value}
            placeholder={definition.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={classNames(inputClassName(hasError), 'font-mono')}
          />
        )
    }
  }

  const renderParameterError = (fieldName: string, clientError: string | undefined) => {
    return clientError ? (
      <div className='mt-1 text-xs text-red-500'>{clientError}</div>
    ) : (
      showInputValidation({ fieldName: fieldName, formErrorFields: formErrorFields })
    )
  }

  const hasSecretFiles = (monitoringDestination?.parameters ?? []).some(
    (parameter: MonitoringParameter) => parameter.target.kind === 'secretFile',
  )

  return (
    <form onSubmit={handleLaunch} className='space-y-6'>
      <BaseSlideOver
        isOpen={isOpenWorkingDirectoryBrowse}
        setIsOpen={setIsOpenWorkingDirectoryBrowse}
        title={'Browse remote filesystem'}
        subtitle={'Navigate the remote file system and select the working directory'}
      >
        <RemoteFilesystemBrowser
          initCurrentPath={workingDirectory}
          initSystemName={system}
          onBrowseSelection={(selectedSystem: string, targetPath: string) => {
            if (selectedSystem !== system) setSystem(selectedSystem)
            setWorkingDirectory(targetPath)
            setIsOpenWorkingDirectoryBrowse(false)
          }}
          mode={RemoteFilesystemBrowserMode.DIRECTORY}
        />
      </BaseSlideOver>

      {prefill && (
        <AlertInfo title='Starting from a previous run'>
          <p>
            Settings are taken from job <span className='font-mono'>{prefill.run.jobId}</span> on{' '}
            {prefill.run.cluster}, a run of {getRecipeName(prefill.run.recipeId, recipes)}
            {prefill.run.startedOn ? `, started on ${prefill.run.startedOn}` : ''}
            {prefill.run.recipeVersion
              ? ` (version ${shortVersion(prefill.run.recipeVersion)})`
              : ''}
            . Changed values are marked in step 4; review them before launching.
          </p>
          {prefill.notes.length > 0 && (
            <ul className='mt-2 list-disc space-y-1 pl-5'>
              {prefill.notes.map((note: string) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </AlertInfo>
      )}

      <SimplePanel
        title={<StepTitle step={1} title='Training recipe' />}
        subtitle='The framework and algorithm used to train the model.'
      >
        <SelectableCardGroup
          name='recipeId'
          label='Training recipe'
          selectedId={recipe?.id ?? null}
          onSelect={handleRecipeSelect}
          requestCard={getRequestCard('recipe')}
          options={recipes.map((r: TrainingRecipe) => ({
            id: r.id,
            title: r.name,
            description: r.description,
            badges: [
              ...(r.getNodeCount
                ? [
                    r.framework,
                    r.algorithm,
                    `${r.gpusPerNode} GPUs per node`,
                    'Nodes set in hyperparameters',
                  ]
                : isNodeCountConfigurable(r)
                  ? [
                      r.framework,
                      r.algorithm,
                      `${r.gpusPerNode} GPUs per node`,
                      'Nodes set at launch',
                    ]
                  : [r.framework, r.algorithm, `${r.nodes.min} node × ${r.gpusPerNode} GPUs`]),
              ...(r.hyperparameterPresets?.length
                ? [`Presets: ${r.hyperparameterPresets.map((p) => p.name).join(', ')}`]
                : []),
            ],
            footer: r.documentationUrl ? (
              <a
                href={r.documentationUrl}
                target='_blank'
                rel='noreferrer'
                className='font-medium text-blue-600 hover:text-blue-500'
              >
                Documentation
              </a>
            ) : undefined,
          }))}
        />
        {showInputValidation({ fieldName: 'recipeId', formErrorFields: formErrorFields })}
      </SimplePanel>

      {recipe && (
        <div ref={setStepRef(2)}>
          <SimplePanel
            title={<StepTitle step={2} title='Model' />}
            subtitle={`Models supported by ${recipe.name}.`}
          >
            <SelectableCardGroup
              name='modelId'
              label='Model'
              selectedId={model?.id ?? null}
              onSelect={handleModelSelect}
              requestCard={getRequestCard('model')}
              options={recipe.models.map((m) => ({
                id: m.id,
                title: m.name,
                description: m.description,
                badges: [m.parameters, m.modelPath],
              }))}
            />
            {showInputValidation({ fieldName: 'modelId', formErrorFields: formErrorFields })}
          </SimplePanel>
        </div>
      )}

      {recipe && isModelStepValid && (
        <div ref={setStepRef(3)}>
          <SimplePanel
            title={<StepTitle step={3} title='Environment or dataset' />}
            subtitle='Where prompts and rewards come from during training.'
          >
            <SelectableCardGroup
              name='environmentId'
              label='Environment or dataset'
              selectedId={environment?.id ?? null}
              onSelect={setEnvironmentId}
              requestCard={getRequestCard('environment')}
              options={recipe.environments.map((e) => ({
                id: e.id,
                title: e.name,
                description: e.description,
                badges: [e.kind === 'dataset' ? 'Dataset' : 'Environment'],
              }))}
            />
            {showInputValidation({ fieldName: 'environmentId', formErrorFields: formErrorFields })}
          </SimplePanel>
        </div>
      )}

      {recipe && model && isEnvironmentStepValid && (
        <div ref={setStepRef(4)}>
          <SimplePanel
            title={<StepTitle step={4} title='Hyperparameters' />}
            subtitle={
              recipe.hyperparameterPresets?.length
                ? 'Choose a preset, then override any of its values as needed.'
                : `Predefined for ${model.name}. Override any value as needed.`
            }
            actionsButtons={
              <button
                type='button'
                onClick={handleResetAllHyperparameters}
                disabled={!isPresetSelected || editedKeys.length === 0}
                className='inline-flex items-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <ArrowUturnLeftIcon className='-ml-0.5 h-4 w-4 text-gray-400' aria-hidden='true' />
                Reset all to defaults
              </button>
            }
          >
            {!!recipe.hyperparameterPresets?.length && (
              <div className={classNames(isPresetSelected ? 'mb-8' : '')}>
                <SelectableCardGroup
                  name='presetId'
                  label='Preset'
                  selectedId={preset?.id ?? null}
                  onSelect={handlePresetSelect}
                  requestCard={getRequestCard('preset')}
                  options={recipe.hyperparameterPresets.map((p: HyperparameterPreset) => ({
                    id: p.id,
                    title: p.name,
                    description: p.description,
                  }))}
                />
                {showInputValidation({ fieldName: 'presetId', formErrorFields: formErrorFields })}
              </div>
            )}
            {isPresetSelected && (
              <div className='space-y-8'>
                {Object.entries(groupHyperparameters(recipe, preset)).map(
                  ([group, definitions]) => (
                    <div key={group}>
                      <h4 className='text-sm font-semibold text-gray-900'>{group}</h4>
                      <div className='mt-3 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3'>
                        {definitions.map((definition: HyperparameterDefinition) => {
                          const fieldName = `${HYPERPARAMETER_FIELD_PREFIX}${definition.key}`
                          const defaultValue = formatHyperparameterValue(
                            defaultHyperparameters[definition.key],
                            definition.type,
                          )
                          const isModified = hyperparameterValues[definition.key] !== defaultValue
                          return (
                            <div key={definition.key}>
                              <div className='flex items-center justify-between gap-x-2'>
                                <label
                                  htmlFor={fieldName}
                                  className='block text-sm font-medium text-gray-700'
                                >
                                  {definition.label}
                                </label>
                                {isModified && (
                                  <button
                                    type='button'
                                    onClick={() => handleHyperparameterReset(definition)}
                                    className='inline-flex items-center gap-x-1 text-xs font-medium text-amber-600 hover:text-amber-700'
                                    title={`Reset to default (${defaultValue})`}
                                  >
                                    <ArrowUturnLeftIcon className='h-3 w-3' aria-hidden='true' />
                                    Modified
                                  </button>
                                )}
                              </div>
                              {renderParameterInput(
                                definition,
                                fieldName,
                                hyperparameterValues[definition.key] ?? '',
                                (value: string) =>
                                  handleHyperparameterChange(definition.key, value),
                                hyperparameterErrors[definition.key],
                              )}
                              {renderParameterError(
                                fieldName,
                                hyperparameterErrors[definition.key],
                              )}
                              <p className='mt-1 text-xs text-gray-500'>
                                <span className='font-mono'>{definition.key}</span> · default{' '}
                                <span className='font-mono'>{defaultValue}</span>
                                {definition.description && <> · {definition.description}</>}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </SimplePanel>
        </div>
      )}

      {recipe && isHyperparametersStepValid && (
        <div ref={setStepRef(5)}>
          <SimplePanel
            title={<StepTitle step={5} title='Monitoring' />}
            subtitle='Where training metrics are sent while the job runs.'
          >
            <SelectableCardGroup
              name='monitoringDestinationId'
              label='Monitoring destination'
              selectedId={monitoringDestination?.id ?? null}
              onSelect={setMonitoringDestinationId}
              requestCard={getRequestCard('monitoring')}
              options={recipe.monitoringDestinations.map((d: MonitoringDestination) => ({
                id: d.id,
                title: d.name,
                description: d.description,
                footer: d.documentationUrl ? (
                  <a
                    href={d.documentationUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='font-medium text-blue-600 hover:text-blue-500'
                  >
                    Documentation
                  </a>
                ) : undefined,
              }))}
            />
            {showInputValidation({
              fieldName: 'monitoringDestinationId',
              formErrorFields: formErrorFields,
            })}
            {monitoringDestination && monitoringDestination.parameters.length > 0 && (
              <div className='mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3'>
                {monitoringDestination.parameters.map((parameter: MonitoringParameter) => {
                  const fieldName = `${MONITORING_FIELD_PREFIX}${parameter.key}`
                  return (
                    <div key={parameter.key}>
                      <label
                        htmlFor={fieldName}
                        className='block text-sm font-medium text-gray-700'
                      >
                        {parameter.label}
                        {parameter.required !== false && (
                          <span className='italic text-red-400'> *</span>
                        )}
                      </label>
                      {renderParameterInput(
                        parameter,
                        fieldName,
                        monitoringValues[parameter.key] ?? '',
                        (value: string) => handleMonitoringChange(parameter.key, value),
                        monitoringErrors[parameter.key],
                      )}
                      {renderParameterError(fieldName, monitoringErrors[parameter.key])}
                      {parameter.description && (
                        <p className='mt-1 text-xs text-gray-500'>{parameter.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {hasSecretFiles && (
              <AlertInfo title='Credentials stay on the cluster' className='mt-6'>
                Secrets are read from files on the cluster when the job starts. They are never sent
                through this page or written into the batch script. Create the file once, for
                example with{' '}
                <code className='font-mono text-xs'>
                  umask 077 &amp;&amp; echo &lt;key&gt; &gt; ~/.wandb_api_key
                </code>
                .
              </AlertInfo>
            )}
            <div className='mt-6 flex items-start gap-x-4 border-t border-gray-200 pt-6'>
              <button
                id='runTracking'
                type='button'
                role='switch'
                aria-checked={runTracking}
                aria-labelledby='runTracking-label'
                aria-describedby='runTracking-description'
                onClick={() => setRunTracking((enabled) => !enabled)}
                className={classNames(
                  runTracking ? 'bg-emerald-600' : 'bg-gray-200',
                  'relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                )}
              >
                <span
                  aria-hidden='true'
                  className={classNames(
                    runTracking ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  )}
                />
              </button>
              <div>
                <label
                  id='runTracking-label'
                  htmlFor='runTracking'
                  className='block text-sm font-medium text-gray-700'
                >
                  Share this run in the run history
                </label>
                <p id='runTracking-description' className='mt-1 text-xs text-gray-500'>
                  Records the recipe, model, preset, hyperparameters and outcome (status and
                  duration), so that others can reuse settings that work. Nothing that identifies
                  you is recorded: no username, account, paths, job id or exact times.
                </p>
              </div>
            </div>
          </SimplePanel>
        </div>
      )}

      {recipe && isMonitoringStepValid && (
        <div ref={setStepRef(6)}>
          <SimplePanel
            title={<StepTitle step={6} title='Launch' />}
            subtitle='Where the training job runs. It is submitted as a regular batch job.'
          >
            <div className='grid grid-cols-6 gap-6'>
              <div className='col-span-6 sm:col-span-3'>
                <label htmlFor='system' className='block text-sm font-medium text-gray-700'>
                  System <span className='italic text-red-400'>*</span>
                </label>
                <select
                  id='system'
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                  disabled={schedulerSystems.length === 0}
                  className={inputClassName(
                    hasErrorForField({ fieldName: 'system', formErrorFields: formErrorFields }),
                  )}
                >
                  {schedulerSystems.length === 0 && <option value=''>No systems available</option>}
                  {schedulerSystems.map((s: System) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {showInputValidation({ fieldName: 'system', formErrorFields: formErrorFields })}
              </div>
              <div className='col-span-6 sm:col-span-3'>
                <label htmlFor='account' className='block text-sm font-medium text-gray-700'>
                  Account <span className='italic text-red-400'>*</span>
                </label>
                <select
                  id='account'
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  disabled={userInfoFetcher.state === 'loading' || groups.length === 0}
                  className={inputClassName(
                    hasErrorForField({ fieldName: 'account', formErrorFields: formErrorFields }),
                  )}
                >
                  <option value=''>
                    {userInfoFetcher.state === 'loading'
                      ? 'Loading…'
                      : groups.length === 0
                        ? 'No accounts available'
                        : 'Select an account'}
                  </option>
                  {groups.map((group: Group) => (
                    <option key={group.id} value={group.name}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {showInputValidation({ fieldName: 'account', formErrorFields: formErrorFields })}
              </div>
              <div className='col-span-6'>
                <label
                  htmlFor='workingDirectory'
                  className='block text-sm font-medium text-gray-700'
                >
                  Working directory <span className='italic text-red-400'>*</span>
                </label>
                <div className='flex mt-1 rounded-md shadow-sm'>
                  <div className='relative flex flex-grow items-stretch focus-within:z-10'>
                    <input
                      id='workingDirectory'
                      type='text'
                      value={workingDirectory}
                      onChange={(e) => setWorkingDirectory(e.target.value)}
                      className={classNames(
                        !!workingDirectoryError ||
                          hasErrorForField({
                            fieldName: 'workingDirectory',
                            formErrorFields: formErrorFields,
                          })
                          ? 'border-red-300 focus:border-red-300 focus:ring-red-300'
                          : 'border-gray-300 focus:border-blue-300 focus:ring-blue-300',
                        'block w-full rounded-l-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none',
                      )}
                      placeholder='/scratch/<my-directory>'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => setIsOpenWorkingDirectoryBrowse(true)}
                    disabled={!system}
                    className='relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <FolderOpenIcon className='-ml-0.5 h-5 w-5 text-gray-400' aria-hidden='true' />
                    Browse remote filesystem
                  </button>
                </div>
                <p className='mt-1 text-xs text-gray-500'>
                  Checkpoints and logs are written to a run directory created inside it.
                </p>
                {renderParameterError('workingDirectory', workingDirectoryError)}
              </div>
              <div className='col-span-6 sm:col-span-2'>
                <label htmlFor='nodes' className='block text-sm font-medium text-gray-700'>
                  Nodes <span className='italic text-red-400'>*</span>
                </label>
                <input
                  id='nodes'
                  type='number'
                  min={recipe.nodes.min}
                  max={recipe.nodes.max}
                  step={1}
                  value={
                    recipe.getNodeCount && nodesResult && 'value' in nodesResult
                      ? nodesResult.value
                      : nodes
                  }
                  onChange={(e) => setNodes(e.target.value)}
                  disabled={!isNodeCountConfigurable(recipe)}
                  className={inputClassName(
                    !!nodesError ||
                      hasErrorForField({ fieldName: 'nodes', formErrorFields: formErrorFields }),
                  )}
                />
                {renderParameterError('nodes', nodesError)}
                <p className='mt-1 text-xs text-gray-500'>
                  {recipe.getNodeCount
                    ? (recipe.nodeCountDescription ?? 'Derived from the hyperparameters')
                    : isNodeCountConfigurable(recipe)
                      ? `${recipe.nodes.min}-${recipe.nodes.max} nodes, ${recipe.gpusPerNode} GPUs each`
                      : `Fixed by ${recipe.name}, ${recipe.gpusPerNode} GPUs`}
                  {nodesResult && 'value' in nodesResult && (
                    <> · {nodesResult.value * recipe.gpusPerNode} GPUs in total</>
                  )}
                </p>
              </div>
              <div className='col-span-6 sm:col-span-2'>
                <label htmlFor='jobName' className='block text-sm font-medium text-gray-700'>
                  Job name <span className='italic text-red-400'>*</span>
                </label>
                <input
                  id='jobName'
                  type='text'
                  value={jobName}
                  onChange={(e) => {
                    setJobName(e.target.value)
                    setIsJobNameEdited(true)
                  }}
                  className={inputClassName(
                    hasErrorForField({ fieldName: 'jobName', formErrorFields: formErrorFields }),
                  )}
                />
                {showInputValidation({ fieldName: 'jobName', formErrorFields: formErrorFields })}
              </div>
              <div className='col-span-6 sm:col-span-2'>
                <label htmlFor='timeLimit' className='block text-sm font-medium text-gray-700'>
                  Time limit <span className='italic text-red-400'>*</span>
                </label>
                <input
                  id='timeLimit'
                  type='text'
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder='HH:MM:SS'
                  className={classNames(
                    inputClassName(
                      hasErrorForField({
                        fieldName: 'timeLimit',
                        formErrorFields: formErrorFields,
                      }),
                    ),
                    'font-mono',
                  )}
                />
                {showInputValidation({ fieldName: 'timeLimit', formErrorFields: formErrorFields })}
              </div>

              <div className='col-span-6'>
                <button
                  type='button'
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className='flex text-sm font-medium text-gray-600 space-x-2'
                >
                  {showAdvancedOptions ? (
                    <ChevronDownIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
                  ) : (
                    <ChevronRightIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
                  )}
                  <span>
                    {showAdvancedOptions
                      ? 'Hide advanced options'
                      : 'Show advanced options (optional)'}
                  </span>
                </button>
              </div>
              {showAdvancedOptions && (
                <>
                  <div className='col-span-6 sm:col-span-3'>
                    <label htmlFor='partition' className='block text-sm font-medium text-gray-700'>
                      Partition
                    </label>
                    <select
                      id='partition'
                      value={partition}
                      onChange={(e) => setPartition(e.target.value)}
                      disabled={partitionsFetcher.state === 'loading'}
                      className={inputClassName(false)}
                    >
                      <option value=''>
                        {partitionsFetcher.state === 'loading' ? 'Loading…' : 'Default partition'}
                      </option>
                      {(partitionsFetcher.data?.partitions ?? []).map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='col-span-6 sm:col-span-3'>
                    <label
                      htmlFor='reservation'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Reservation
                    </label>
                    <select
                      id='reservation'
                      value={reservation}
                      onChange={(e) => setReservation(e.target.value)}
                      disabled={reservationsFetcher.state === 'loading'}
                      className={inputClassName(false)}
                    >
                      <option value=''>
                        {reservationsFetcher.state === 'loading' ? 'Loading…' : 'No reservation'}
                      </option>
                      {(reservationsFetcher.data?.reservations ?? []).map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name} ({r.state})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className='col-span-6'>
                <button
                  type='button'
                  onClick={() => setShowScript(!showScript)}
                  className='flex text-sm font-medium text-gray-600 space-x-2'
                >
                  {showScript ? (
                    <ChevronDownIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
                  ) : (
                    <ChevronRightIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
                  )}
                  <span>{showScript ? 'Hide batch script' : 'Preview batch script'}</span>
                </button>
                {showScript &&
                  (script ? (
                    <pre className='mt-3 max-h-[32rem] overflow-auto rounded-md border border-gray-300 bg-gray-50 p-3 text-xs text-gray-800'>
                      {script}
                    </pre>
                  ) : (
                    <p className='mt-3 text-sm text-red-500'>
                      Fix the launch options above to preview the batch script.
                    </p>
                  ))}
              </div>
            </div>
            <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              <RequestCard {...getRequestCard('launch')} />
            </div>
            <div className='flex items-center justify-end bg-gray-50 mt-6 -mx-4 -mb-5 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 rounded-b-lg'>
              <LoadingButton isLoading={isSubmitting} className='sm:w-auto sm:text-sm'>
                <button
                  type='submit'
                  disabled={!canLaunch}
                  className='inline-flex justify-center rounded-md border border-transparent bg-emerald-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  Launch training
                </button>
              </LoadingButton>
            </div>
          </SimplePanel>
        </div>
      )}
    </form>
  )
}

export default RLTrainingForm
