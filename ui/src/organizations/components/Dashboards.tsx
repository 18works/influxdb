// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import {connect} from 'react-redux'
import {downloadTextFile} from 'src/shared/utils/download'
import _ from 'lodash'

// Components
import DashboardsIndexContents from 'src/dashboards/components/dashboard_index/DashboardsIndexContents'
import {OverlayTechnology, Input, Tabs} from 'src/clockface'
import {Button, ComponentColor, IconFont} from '@influxdata/clockface'
import ImportDashboardOverlay from 'src/dashboards/components/ImportDashboardOverlay'
import EditLabelsOverlay from 'src/shared/components/EditLabelsOverlay'

// Utils
import {getDeep} from 'src/utils/wrappers'

// APIs
import {createDashboard, cloneDashboard} from 'src/dashboards/apis/v2/'

// Actions
import {
  getDashboardsAsync,
  importDashboardAsync,
  deleteDashboardAsync,
  updateDashboardAsync,
  addDashboardLabelsAsync,
  removeDashboardLabelsAsync,
} from 'src/dashboards/actions/v2'
import {setDefaultDashboard} from 'src/shared/actions/links'
import {retainRangesDashTimeV1 as retainRangesDashTimeV1Action} from 'src/dashboards/actions/v2/ranges'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {
  dashboardSetDefaultFailed,
  dashboardExported,
  dashboardExportFailed,
  dashboardCreateFailed,
} from 'src/shared/copy/notifications'

// Constants
import {DEFAULT_DASHBOARD_NAME} from 'src/dashboards/constants/index'

// Types
import {Notification} from 'src/types/notifications'
import {DashboardFile} from 'src/types/v2/dashboards'
import {Links, Cell, Dashboard, AppState, Organization} from 'src/types/v2'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface DispatchProps {
  handleSetDefaultDashboard: typeof setDefaultDashboard
  handleGetDashboards: typeof getDashboardsAsync
  handleDeleteDashboard: typeof deleteDashboardAsync
  handleImportDashboard: typeof importDashboardAsync
  handleUpdateDashboard: typeof updateDashboardAsync
  notify: (message: Notification) => void
  retainRangesDashTimeV1: (dashboardIDs: string[]) => void
  onAddDashboardLabels: typeof addDashboardLabelsAsync
  onRemoveDashboardLabels: typeof removeDashboardLabelsAsync
}

interface StateProps {
  links: Links
  dashboards: Dashboard[]
  orgs: Organization[]
}

interface OwnProps {
  dashboards: Dashboard[]
  onChange: () => void
  orgName: string
  orgID: string
}

type Props = DispatchProps & StateProps & OwnProps & WithRouterProps

interface State {
  searchTerm: string
  isImportingDashboard: boolean
  isEditingDashboardLabels: boolean
  dashboardLabelsEdit: Dashboard
}

@ErrorHandling
class Dashboards extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
      isImportingDashboard: false,
      isEditingDashboardLabels: false,
      dashboardLabelsEdit: null,
    }
  }

  public async componentDidMount() {
    const {handleGetDashboards, dashboards} = this.props
    await handleGetDashboards()
    const dashboardIDs = dashboards.map(d => d.id)
    this.props.retainRangesDashTimeV1(dashboardIDs)
  }

  public render() {
    const {dashboards, notify, links, handleUpdateDashboard, orgs} = this.props
    const {searchTerm} = this.state

    return (
      <>
        <Tabs.TabContentsHeader>
          <Input
            icon={IconFont.Search}
            placeholder="Filter dashboards..."
            widthPixels={290}
            value={searchTerm}
            onChange={this.handleFilterChange}
            onBlur={this.handleFilterBlur}
            testID={`dashboards--filter-field ${searchTerm}`}
            customClass="filter-dashboards"
          />
          <Button
            color={ComponentColor.Primary}
            onClick={this.handleCreateDashboard}
            icon={IconFont.Plus}
            text="Create Dashboard"
            titleText="Create a new dashboard"
          />
        </Tabs.TabContentsHeader>
        <DashboardsIndexContents
          dashboards={dashboards}
          orgs={orgs}
          onSetDefaultDashboard={this.handleSetDefaultDashboard}
          defaultDashboardLink={links.defaultDashboard}
          onDeleteDashboard={this.handleDeleteDashboard}
          onCreateDashboard={this.handleCreateDashboard}
          onCloneDashboard={this.handleCloneDashboard}
          onExportDashboard={this.handleExportDashboard}
          onUpdateDashboard={handleUpdateDashboard}
          notify={notify}
          searchTerm={searchTerm}
          showOwnerColumn={false}
          onFilterChange={this.handleFilterUpdate}
        />
        {this.renderImportOverlay}
        {this.renderLabelEditorOverlay}
      </>
    )
  }

  private handleFilterBlur = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value})
  }

  private handleFilterChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value})
  }

  private handleFilterUpdate = (searchTerm: string): void => {
    this.setState({searchTerm})
  }
  private handleSetDefaultDashboard = async (
    defaultDashboardLink: string
  ): Promise<void> => {
    const {dashboards, notify, handleSetDefaultDashboard} = this.props
    const {name} = dashboards.find(d => d.links.self === defaultDashboardLink)

    try {
      await handleSetDefaultDashboard(defaultDashboardLink)
    } catch (error) {
      console.error(error)
      notify(dashboardSetDefaultFailed(name))
    }
  }

  private handleCreateDashboard = async (): Promise<void> => {
    const {router, notify, orgs} = this.props
    try {
      const newDashboard = {
        name: DEFAULT_DASHBOARD_NAME,
        cells: [],
        orgID: orgs[0].id,
      }
      const data = await createDashboard(newDashboard)
      router.push(`/dashboards/${data.id}`)
    } catch (error) {
      notify(dashboardCreateFailed())
    }
  }

  private handleCloneDashboard = async (
    dashboard: Dashboard
  ): Promise<void> => {
    const {router, notify, orgs, dashboards} = this.props
    try {
      const data = await cloneDashboard(
        {
          ...dashboard,
          orgID: orgs[0].id,
        },
        dashboards
      )
      router.push(`/dashboards/${data.id}`)
    } catch (error) {
      console.error(error)
      notify(dashboardCreateFailed())
    }
  }

  private handleDeleteDashboard = (dashboard: Dashboard) => {
    this.props.handleDeleteDashboard(dashboard)
  }

  private handleExportDashboard = async (
    dashboard: Dashboard
  ): Promise<void> => {
    const {notify} = this.props
    const dashboardForDownload = await this.modifyDashboardForDownload(
      dashboard
    )
    try {
      downloadTextFile(
        JSON.stringify(dashboardForDownload, null, '\t'),
        `${dashboard.name}.json`
      )
      notify(dashboardExported(dashboard.name))
    } catch (error) {
      notify(dashboardExportFailed(dashboard.name, error))
    }
  }

  private modifyDashboardForDownload = async (
    dashboard: Dashboard
  ): Promise<DashboardFile> => {
    return {meta: {chronografVersion: '2.0'}, dashboard}
  }

  private handleImportDashboard = async (
    dashboard: Dashboard
  ): Promise<void> => {
    const defaultCell = {
      x: 0,
      y: 0,
      w: 4,
      h: 4,
    }

    const name = _.get(dashboard, 'name', DEFAULT_DASHBOARD_NAME)
    const cellsWithDefaultsApplied = getDeep<Cell[]>(
      dashboard,
      'cells',
      []
    ).map(c => ({...defaultCell, ...c}))

    await this.props.handleImportDashboard({
      ...dashboard,
      name,
      cells: cellsWithDefaultsApplied,
    })
  }

  private handleToggleOverlay = (): void => {
    this.setState({isImportingDashboard: !this.state.isImportingDashboard})
  }

  private get renderImportOverlay(): JSX.Element {
    const {notify} = this.props
    const {isImportingDashboard} = this.state

    return (
      <OverlayTechnology visible={isImportingDashboard}>
        <ImportDashboardOverlay
          onDismissOverlay={this.handleToggleOverlay}
          onImportDashboard={this.handleImportDashboard}
          notify={notify}
        />
      </OverlayTechnology>
    )
  }

  private handleStopEditingLabels = (): void => {
    this.setState({isEditingDashboardLabels: false})
  }

  private get renderLabelEditorOverlay(): JSX.Element {
    const {onAddDashboardLabels, onRemoveDashboardLabels} = this.props
    const {isEditingDashboardLabels, dashboardLabelsEdit} = this.state

    return (
      <OverlayTechnology visible={isEditingDashboardLabels}>
        <EditLabelsOverlay<Dashboard>
          resource={dashboardLabelsEdit}
          onDismissOverlay={this.handleStopEditingLabels}
          onAddLabels={onAddDashboardLabels}
          onRemoveLabels={onRemoveDashboardLabels}
        />
      </OverlayTechnology>
    )
  }
}

const mstp = (state: AppState): StateProps => {
  const {dashboards, links, orgs} = state

  return {
    orgs,
    dashboards,
    links,
  }
}

const mdtp: DispatchProps = {
  notify: notifyAction,
  handleSetDefaultDashboard: setDefaultDashboard,
  handleGetDashboards: getDashboardsAsync,
  handleDeleteDashboard: deleteDashboardAsync,
  handleImportDashboard: importDashboardAsync,
  handleUpdateDashboard: updateDashboardAsync,
  retainRangesDashTimeV1: retainRangesDashTimeV1Action,
  onAddDashboardLabels: addDashboardLabelsAsync,
  onRemoveDashboardLabels: removeDashboardLabelsAsync,
}

export default connect<StateProps, DispatchProps, OwnProps>(
  mstp,
  mdtp
)(withRouter<OwnProps>(Dashboards))
