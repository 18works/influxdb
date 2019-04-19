import React, {PureComponent, ChangeEvent} from 'react'

// Components
import {Overlay, Input, Form} from 'src/clockface'
import {
  Alert,
  IconFont,
  ComponentColor,
  ComponentSpacer,
  AlignItems,
  FlexDirection,
  ComponentSize,
  Button,
  ButtonType,
} from '@influxdata/clockface'
import {withRouter, WithRouterProps} from 'react-router'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface State {
  description: string
}

type Props = WithRouterProps

@ErrorHandling
class AllAccessTokenOverlay extends PureComponent<Props, State> {
  public state = {description: ''}

  render() {
    const {description} = this.state

    return (
      <Overlay visible={true}>
        <Overlay.Container>
          <Overlay.Heading
            title="Generate All Access Token Overlay"
            onDismiss={this.handleDismiss}
          />
          <Overlay.Body>
            <Form onSubmit={this.handleSave}>
              <ComponentSpacer
                alignItems={AlignItems.Center}
                direction={FlexDirection.Column}
                margin={ComponentSize.Large}
              >
                <Form.Element label="Description">
                  <Input
                    placeholder="Describe this new token"
                    value={description}
                    onChange={this.handleInputChange}
                  />
                </Form.Element>
                <Alert
                  icon={IconFont.AlertTriangle}
                  color={ComponentColor.Warning}
                >
                  This token will be able to create, update, delete, read, and
                  write to anything in this organization
                </Alert>

                <ComponentSpacer
                  alignItems={AlignItems.Center}
                  direction={FlexDirection.Row}
                  margin={ComponentSize.Small}
                >
                  <Button
                    text="Cancel"
                    icon={IconFont.Remove}
                    onClick={this.handleDismiss}
                  />

                  <Button
                    text="Save"
                    icon={IconFont.Checkmark}
                    color={ComponentColor.Success}
                    type={ButtonType.Submit}
                  />
                </ComponentSpacer>
              </ComponentSpacer>
            </Form>
          </Overlay.Body>
        </Overlay.Container>
      </Overlay>
    )
  }

  private handleSave = () => {
    this.handleDismiss()
  }

  private handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target

    this.setState({description: value})
  }

  private handleDismiss = () => {
    const {
      router,
      params: {orgID},
    } = this.props

    router.push(`/orgs/${orgID}/tokens`)
  }
}

export default withRouter(AllAccessTokenOverlay)
