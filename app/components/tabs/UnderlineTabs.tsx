import React, { useState, ReactNode } from 'react'
import { classNames } from '~/helpers/class-helper'

interface TabPanelProps {
  label?: string
  children: ReactNode
}

interface TabsProps {
  children: React.ReactElement<TabPanelProps>[]
}

const flattenChildren = (children: React.ReactNode): React.ReactNode[] => {
  const flatChildren: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === React.Fragment) {
      flatChildren.push(...flattenChildren(child.props.children))
    } else {
      flatChildren.push(child)
    }
  })

  return flatChildren
}

const UnderlineTabs: React.FC<TabsProps> = ({ children }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(0)

  const flattenedChildren = flattenChildren(children)

  const validChildren = flattenedChildren.filter(
    (child) => React.isValidElement(child) && 'label' in child.props,
  ) as React.ReactElement<TabPanelProps>[]

  const tabs = validChildren.map((child) => child.props.label)

  return (
    <div>
      <div className='sm:hidden'>
        <label htmlFor='tabs' className='sr-only'>
          Select a tab
        </label>
        <select
          id='tabs'
          name='tabs'
          defaultValue={tabs[activeTab]}
          className='block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
        >
          {tabs.map((label, index) => (
            <option key={index}>{label}</option>
          ))}
        </select>
      </div>
      <div className='hidden sm:block'>
        <div className='border-b border-gray-200'>
          <nav aria-label='Tabs' className='-mb-px flex space-x-8'>
            {tabs.map((label, index) => (
              <button
                key={index}
                aria-current={activeTab === index ? 'page' : undefined}
                className={classNames(
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
                )}
                onClick={() => setActiveTab(index)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className='mt-4'>
        {validChildren.map((child, index) => (index === activeTab ? child : null))}
      </div>
    </div>
  )
}

const UnderlineTabPanel: React.FC<TabPanelProps> = ({ children }: TabPanelProps) => {
  return <div>{children}</div>
}

export { UnderlineTabs, UnderlineTabPanel }
