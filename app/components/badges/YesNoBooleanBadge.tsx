// badges
import LabelBadge, { LabelColor } from './LabelBadge'

const YesNoBooleanBadge: React.FC<any> = ({ booleanValue }: any) => {
  if (booleanValue) {
    return <LabelBadge color={LabelColor.GREEN}>Yes</LabelBadge>
  }
  return <LabelBadge color={LabelColor.RED}>No</LabelBadge>
}

export default YesNoBooleanBadge
