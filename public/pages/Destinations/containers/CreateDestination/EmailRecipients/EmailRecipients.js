/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem, EuiSmallButton } from '@elastic/eui';

import { FormikComboBox } from '../../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../../utils/validate';
import ManageEmailGroups from '../ManageEmailGroups';
import { validateEmailRecipients } from './utils/validate';
import { RECIPIENT_TYPE } from './utils/constants';
import getEmailGroups from './utils/helpers';
import { getAllowList } from '../../../utils/helpers';
import { DESTINATION_TYPE } from '../../../utils/constants';

export default class EmailRecipients extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      emailGroups: [], // TODO: Possibly add emails here instead of ManageEmailGroups
      recipientOptions: [],
      isLoading: true,
      showManageEmailGroupsModal: false,
      allowList: [],
    };

    this.onClickManageEmailGroups = this.onClickManageEmailGroups.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
  }

  async componentDidMount() {
    const { httpClient } = this.props;
    const allowList = await getAllowList(httpClient);
    this.setState({ allowList });

    this.loadData();
  }

  onClickManageEmailGroups() {
    this.setState({ showManageEmailGroupsModal: true });
  }

  onClickCancel() {
    this.setState({ showManageEmailGroupsModal: false });
  }

  onCreateOption = (fieldName, value, selectedOptions, setFieldValue) => {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) return;

    const newOption = {
      label: value,
      value: value,
      type: RECIPIENT_TYPE.EMAIL,
    };
    setFieldValue(fieldName, [...selectedOptions, newOption]);
  };

  onClickSave = () => {
    // TODO: Check if 'then' is necessary here
    // this.setState({ showManageEmailGroupsModal: false });
    this.loadData().then((r) => this.setState({ showManageEmailGroupsModal: false }));
  };

  // TODO: Only loading email groups here at the moment, should add emails as options too
  loadData = async (searchText = '') => {
    const { httpClient } = this.props;
    this.setState({ isLoading: true });

    const emailGroups = await getEmailGroups(httpClient);
    const emailGroupOptions = emailGroups.map((emailGroup) => ({
      label: emailGroup.name,
      value: emailGroup.id,
      type: RECIPIENT_TYPE.EMAIL_GROUP,
    }));

    this.setState({
      recipientOptions: emailGroupOptions,
      isLoading: false,
    });
  };

  isEmailAllowed = () => {
    const { allowList } = this.state;
    return allowList.includes(DESTINATION_TYPE.EMAIL);
  };

  render() {
    const { httpClient, type, notifications } = this.props;
    const { recipientOptions, isLoading, showManageEmailGroupsModal } = this.state;
    return (
      <Fragment>
        <EuiFlexGroup
          direction="row"
          gutterSize="s"
          alignItems="flexStart"
          style={{ paddingLeft: '10px' }}
        >
          <EuiFlexItem grow={false}>
            <FormikComboBox
              name={`${type}.emailRecipients`}
              formRow
              fieldProps={{ validate: validateEmailRecipients }}
              rowProps={{
                label: 'Recipients',
                helpText:
                  'Add recipient(s) using an email address or a pre-created email group. ' +
                  'Use "Manage email groups" to create or remove email groups.',
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Email address, email group name',
                async: true,
                isLoading: isLoading,
                options: recipientOptions,
                onChange: (options, field, form) => {
                  form.setFieldValue(`${type}.emailRecipients`, options);
                },
                onBlur: (e, field, form) => {
                  form.setFieldTouched(`${type}.emailRecipients`, true);
                },
                onCreateOption: (value, field, form) => {
                  this.onCreateOption(
                    `${type}.emailRecipients`,
                    value,
                    field.value,
                    form.setFieldValue
                  );
                },
                isDisabled: true,
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton style={{ marginTop: 22 }} onClick={this.onClickManageEmailGroups}>
              Manage email groups
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <ManageEmailGroups
          httpClient={httpClient}
          isEmailAllowed={this.isEmailAllowed()}
          isVisible={showManageEmailGroupsModal}
          onClickCancel={this.onClickCancel}
          onClickSave={this.onClickSave}
          notifications={notifications}
        />
      </Fragment>
    );
  }
}

EmailRecipients.propTypes = {
  httpClient: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  notifications: PropTypes.object.isRequired,
};
