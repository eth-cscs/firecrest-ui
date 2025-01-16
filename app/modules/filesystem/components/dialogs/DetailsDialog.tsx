// types
import { File, FileType } from '~/types/api-filesystem'
// helpers
import { prettyBytes } from '~/helpers/file-helper'
import { formatDateTime } from '~/helpers/date-helper'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// codes
import CodeBlock from '~/components/codes/CodeBlock'
// lists
import DescriptionList from '~/components/lists/DescriptionList'
// dialogs
import SimpleDialog, { SimpleDialogSize } from '~/components/dialogs/SimpleDialog'

interface DetailsProps {
  file: File
  currentPath: string
}

const FileDetails: React.FC<DetailsProps> = ({ file, currentPath }: DetailsProps) => {
  const data = [
    {
      label: 'File name',
      content: <CodeBlock code={file.name} />,
    },
    {
      label: 'File path',
      content: <CodeBlock code={`${currentPath}/${file.name}`} />,
    },
    {
      label: 'Group',
      content: <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>,
    },
    {
      label: 'Owner',
      content: <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>,
    },
    {
      label: 'Permissions',
      content: <LabelBadge color={LabelColor.GRAY}>{file.permissions}</LabelBadge>,
    },
    {
      label: 'Size',
      content: prettyBytes(parseInt(file.size)),
    },
    {
      label: 'Last modified',
      content: formatDateTime({ dateTime: file.lastModified }),
    },
  ]
  return <DescriptionList data={data} />
}

const DirectoryDetails: React.FC<DetailsProps> = ({ file, currentPath }: DetailsProps) => {
  const data = [
    {
      label: 'Directory name',
      content: <CodeBlock code={file.name} />,
    },
    {
      label: 'Directory path',
      content: <CodeBlock code={`${currentPath}/${file.name}`} />,
    },
    {
      label: 'Group',
      content: <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>,
    },
    {
      label: 'Owner',
      content: <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>,
    },
    {
      label: 'Permissions',
      content: <LabelBadge color={LabelColor.GRAY}>{file.permissions}</LabelBadge>,
    },
    {
      label: 'Size',
      content: prettyBytes(parseInt(file.size)),
    },
    {
      label: 'Last modified',
      content: formatDateTime({ dateTime: file.lastModified }),
    },
  ]
  return <DescriptionList data={data} />
}

const SymlinkDetails: React.FC<DetailsProps> = ({ file, currentPath }: DetailsProps) => {
  const data = [
    {
      label: 'Symlink name',
      content: <CodeBlock code={file.name} />,
    },
    {
      label: 'Symlink path',
      content: <CodeBlock code={`${currentPath}/${file.name}`} />,
    },
    {
      label: 'Symlink target',
      content: <CodeBlock code={file.linkTarget} />,
    },
    {
      label: 'Group',
      content: <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>,
    },
    {
      label: 'Owner',
      content: <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>,
    },
    {
      label: 'Permissions',
      content: <LabelBadge color={LabelColor.GRAY}>{file.permissions}</LabelBadge>,
    },
    {
      label: 'Size',
      content: prettyBytes(parseInt(file.size)),
    },
    {
      label: 'Last modified',
      content: formatDateTime({ dateTime: file.lastModified }),
    },
  ]
  return <DescriptionList data={data} />
}

interface DetailsDialogProps {
  file: File
  currentPath: string
  open: boolean
  onClose: () => void
}

const DetailsDialog: React.FC<DetailsDialogProps> = ({
  file,
  currentPath,
  open,
  onClose,
}: DetailsDialogProps) => {
  const dialogTitle = (file: File) => {
    switch (file.type) {
      case FileType.file:
        return 'File details'
      case FileType.symlink:
        return 'Symlink details'
      case FileType.directory:
        return 'Directory details'
      default:
        return null
    }
  }

  const dialogSubtitle = (file: File) => {
    switch (file.type) {
      case FileType.file:
        return 'File information and details'
      case FileType.symlink:
        return 'Symlink information and details'
      case FileType.directory:
        return 'Directory information and details'
      default:
        return null
    }
  }

  const dialogContent = (file: File, currentPath: string) => {
    switch (file.type) {
      case FileType.file:
        return <FileDetails file={file} currentPath={currentPath} />
      case FileType.symlink:
        return <SymlinkDetails file={file} currentPath={currentPath} />
      case FileType.directory:
        return <DirectoryDetails file={file} currentPath={currentPath} />
      default:
        return null
    }
  }

  return (
    <SimpleDialog
      title={dialogTitle(file)}
      subtitle={dialogSubtitle(file)}
      size={SimpleDialogSize.MEDIUM}
      open={open}
      onClose={onClose}
    >
      {dialogContent(file, currentPath)}
    </SimpleDialog>
  )
}

export default DetailsDialog
