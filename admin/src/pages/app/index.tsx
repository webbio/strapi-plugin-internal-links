import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { NotFound } from '@strapi/helper-plugin';

import pluginId from '../../plugin-id';
import HomePage from '../home-page';

const App: React.FunctionComponent = () => {
	return (
		<div>
			<Switch>
				<Route path={`/plugins/${pluginId}`} component={HomePage} exact />
				<Route component={NotFound} />
			</Switch>
		</div>
	);
};

export default App;
