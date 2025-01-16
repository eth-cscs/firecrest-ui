import React, { useEffect, useState } from 'react'
// types
import { File, GetOpsChecksumResponse } from '~/types/api-filesystem'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'
// codes
import CodeBlock from '~/components/codes/CodeBlock'
// alerts
import AlertError from '~/components/alerts/AlertError'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'
// apis
import { getLocalOpsChecksum } from '~/apis/filesystem-api'

interface ChecksumDialogProps {
  system: string
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const ChecksumDialog: React.FC<ChecksumDialogProps> = ({
  system,
  file,
  currentPath,
  open,
  onClose,
}: ChecksumDialogProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [localError, setLocalError] = useState<any>(null)
  const [checksum, setChecksum] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      setLoading(true)
      const fetchData = async () => {
        const response: GetOpsChecksumResponse = await getLocalOpsChecksum(
          system,
          `${currentPath}/${file.name}`,
        )
        setChecksum(response.output?.checksum || '')
        setLoading(false)
      }
      fetchData().catch((response) => {
        setLoading(false)
        setLocalError(response?.error)
      })
    } else {
      setLoading(false)
      setChecksum(null)
      setLocalError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return (
    <SimpleDialog
      title='Calculate checksum'
      subtitle='Calculate the SHA256 (256-bit) checksum of the selected file'
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      <AlertError error={localError} />
      {loading && <LoadingSpinner title='Loading checksum...' className='py-10' />}
      {!loading && checksum !== null && (
        <>
          <div className='text-sm font-medium text-gray-900 pb-2'>Calculated checksum</div>
          <CodeBlock code={checksum} />
        </>
      )}
    </SimpleDialog>
  )
}

export default ChecksumDialog
