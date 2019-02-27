// Libraries
import React, {Component} from 'react'
import _ from 'lodash'

// Components
import {Label} from 'src/clockface'
import InlineLabelEditor from 'src/shared/components/inline_label_editor/InlineLabelEditor'

// Types
import {Label as LabelType} from 'src/types/v2/labels'

// Styles
import 'src/shared/components/inline_label_editor/ResourceLabels.scss'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  selectedLabels: LabelType[]
  labels: LabelType[]
  onRemoveLabel: (label: LabelType) => void
  onAddLabel: (label: LabelType) => void
  onFilterChange: (searchTerm: string) => void
}

@ErrorHandling
export default class ResourceLabels extends Component<Props> {
  public render() {
    return <div className="resource-labels">{this.selectedLabels}</div>
  }

  private get selectedLabels(): JSX.Element {
    const {selectedLabels} = this.props

    if (selectedLabels.length) {
      return (
        <div className="resource-labels--margin">
          {this.inlineLabelEditor}
          {selectedLabels.map(label => (
            <Label
              id={label.id}
              key={label.id}
              name={label.name}
              colorHex={label.properties.color}
              description={label.properties.description}
              onDelete={this.handleDeleteLabel}
              onClick={this.handleLabelClick}
            />
          ))}
        </div>
      )
    }

    return (
      <div className="resource-labels--empty">{this.inlineLabelEditor}</div>
    )
  }

  private handleLabelClick = (labelID: string): void => {
    const {onFilterChange, labels} = this.props

    const labelName = labels.find(l => l.id === labelID).name

    onFilterChange(labelName)
  }

  private handleDeleteLabel = (labelID: string): void => {
    const {onRemoveLabel, selectedLabels} = this.props
    const label = selectedLabels.find(label => label.id === labelID)

    onRemoveLabel(label)
  }

  private get inlineLabelEditor(): JSX.Element {
    const {selectedLabels, labels, onAddLabel} = this.props

    return (
      <InlineLabelEditor
        labels={labels}
        selectedLabels={selectedLabels}
        onAddLabel={onAddLabel}
        onCreateLabel={this.handleCreateLabel}
      />
    )
  }

  private handleCreateLabel = (name: string): void => {
    console.log(name)
  }
}
