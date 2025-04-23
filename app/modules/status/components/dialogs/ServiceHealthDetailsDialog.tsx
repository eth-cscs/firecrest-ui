/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'
// lists
import DescriptionList from '~/components/lists/DescriptionList'
import JsonViewer from '~/components/views/JsonViewer'

function parsePythonJson(pythonJsonStr: string): unknown {
  if (!pythonJsonStr || typeof pythonJsonStr !== 'string') {
    return { error: 'Invalid input: not a string' }
  }
  try {
    // getting Python-style JSON string and need to convert it to valid JSON
    const fixedStr = pythonJsonStr
      .replace(/'/g, '"') // Convert single to double quotes
      .replace(/\bTrue\b/g, 'true') // Replace True
      .replace(/\bFalse\b/g, 'false') // Replace False
      .replace(/\bNone\b/g, 'null') // Replace None

    // Step 2: Parse as normal JSON
    return JSON.parse(fixedStr)
  } catch (err) {
    console.error('Invalid Python-style JSON string:', err)
    return { error: 'Parsing failed' }
  }
}

const ServiceHealthDetailsDialog: React.FC<any> = ({
  serviceHealthMessage,
  open,
  onClose,
}: any) => {
  const jsonData = parsePythonJson(serviceHealthMessage)

  const dataDescription = [
    {
      label: 'Data',
      content: (
        <div>
          <JsonViewer data={jsonData} />
        </div>
      ),
    },
  ]

  return (
    <SimpleDialog
      title={`Remote system data`}
      subtitle=''
      open={open}
      onClose={onClose}
      size={SimpleDialogSize.MEDIUM}
    >
      <DescriptionList data={dataDescription} />
    </SimpleDialog>
  )
}

export default ServiceHealthDetailsDialog
