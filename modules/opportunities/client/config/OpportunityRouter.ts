'use strict';

import { Ng1StateDeclaration, StateParams, StateProvider } from '@uirouter/angularjs';
import angular, { resource } from 'angular';
import { ICapabilitiesService, ICapabilityResource } from '../../../capabilities/client/services/CapabilitiesService';
import { IOrgService } from '../../../orgs/client/services/OrgService';
import { IOrg } from '../../../orgs/shared/IOrgDTO';
import { IProgram } from '../../../programs/shared/IProgramDTO';
import { IProject } from '../../../projects/shared/IProjectDTO';
import { IProposalResource, IProposalService } from '../../../proposals/client/services/ProposalService';
import { IAuthenticationService } from '../../../users/client/services/AuthenticationService';
import { IOpportunitiesService, IOpportunityResource } from '../services/OpportunitiesService';

export default class OpportunityRouter {
	public static $inject = ['$stateProvider'];

	constructor(private $stateProvider: StateProvider) {
		this.init();
	}

	private init(): void {
		this.$stateProvider.state('opportunities', this.rootState());
		this.$stateProvider.state('opportunities.list', this.listState());
		this.$stateProvider.state('opportunities.viewcwu', this.viewCWUState());
		this.$stateProvider.state('opportunities.viewswu', this.viewSWUState());

		this.$stateProvider.state('opportunityadmin', this.adminRootState());
		this.$stateProvider.state('opportunityadmin.editcwu', this.editCWUState());
		this.$stateProvider.state('opportunityadmin.editswu', this.editSWUState());
		this.$stateProvider.state('createcwu', this.createCWUState());
		this.$stateProvider.state('createswu', this.createSWUState());
		this.$stateProvider.state('oppcreatelanding', this.createLandingState());
	}

	private rootState(): Ng1StateDeclaration {
		return {
			abstract: true,
			url: '/opportunities',
			template: '<ui-view autoscroll="true"></ui-view>',
			resolve: {
				capabilities: [
					'CapabilitiesService',
					(CapabilitiesService: ICapabilitiesService) => {
						return CapabilitiesService.query().$promise;
					}
				]
			}
		};
	}

	private listState(): Ng1StateDeclaration {
		return {
			url: '',
			templateUrl: '/modules/opportunities/client/views/opportunity-list.html',
			controller: 'OpportunityListController',
			controllerAs: 'vm',
			data: {
				pageTitle: 'Opportunities List'
			},
			ncyBreadcrumb: {
				label: 'All opportunities'
			}
		};
	}

	private viewCWUState(): Ng1StateDeclaration {
		return {
			url: '/cwu/:opportunityId',
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-view.html',
			controller: 'OpportunityViewCWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'$stateParams',
					'OpportunitiesService',
					async ($stateParams: StateParams, OpportunitiesService: IOpportunitiesService): Promise<IOpportunityResource> => {
						return await OpportunitiesService.get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				],
				myproposal: [
					'$stateParams',
					'ProposalService',
					'AuthenticationService',
					async ($stateParams: StateParams, ProposalService: IProposalService, AuthenticationService: IAuthenticationService): Promise<IProposalResource> => {
						if (!AuthenticationService.user) {
							return null;
						}

						return await ProposalService.getMyProposal({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				]
			},
			data: {
				pageTitle: 'Opportunity: {{opportunity.name}}'
			},
			ncyBreadcrumb: {
				label: '{{ vm.opportunity.name }}',
				parent: 'opportunities.list'
			}
		};
	}

	private viewSWUState(): Ng1StateDeclaration {
		return {
			url: '/swu/:opportunityId',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-view.html',
			controller: 'OpportunityViewSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'$stateParams',
					'OpportunitiesService',
					async ($stateParams: StateParams, OpportunitiesService: IOpportunitiesService): Promise<IOpportunityResource> => {
						return await OpportunitiesService.get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				],
				org: [
					'AuthenticationService',
					'OrgService',
					async (AuthenticationService: IAuthenticationService, OrgService: IOrgService): Promise<IOrg> => {
						if (!AuthenticationService.user) {
							return null;
						}

						const orgs = await OrgService.myadmin().$promise;
						if (orgs && orgs.length > 0) {
							return orgs[0];
						} else {
							return null;
						}
					}
				],
				myproposal: [
					'$stateParams',
					'ProposalService',
					'AuthenticationService',
					'org',
					async ($stateParams: StateParams, ProposalService: IProposalService, AuthenticationService: IAuthenticationService, org: IOrg): Promise<IProposalResource> => {
						if (!AuthenticationService.user) {
							return null;
						}

						if (!org || !org._id) {
							return null;
						}

						return await ProposalService.getMyProposal({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				]
			},
			data: {
				pageTitle: 'Opportunity: {{ opportunity.name }}'
			},
			ncyBreadcrumb: {
				label: '{{ vm.opportunity.name }}',
				parent: 'opportunities.list'
			}
		};
	}

	private adminRootState(): Ng1StateDeclaration {
		return {
			abstract: true,
			url: '/opportunityadmin/:opportunityId',
			template: '<ui-view autoscroll="true"></ui-view>',
			resolve: {
				capabilities: [
					'CapabilitiesService',
					async (CapabilitiesService: ICapabilitiesService): Promise<resource.IResourceArray<ICapabilityResource>> => {
						return await CapabilitiesService.query().$promise;
					}
				],
				programs: [
					'ProgramsService',
					async (ProgramsService: any): Promise<IProgram[]> => {
						return await ProgramsService.myadmin().$promise;
					}
				],
				projects: [
					'ProjectsService',
					async (ProjectsService: any): Promise<IProject> => {
						return await ProjectsService.myadmin().$promise;
					}
				],
				editing() {
					return true;
				},
				opportunity: [
					'$stateParams',
					'OpportunitiesService',
					async ($stateParams: StateParams, OpportunitiesService: IOpportunitiesService): Promise<IOpportunityResource> => {
						return await OpportunitiesService.get({
							opportunityId: $stateParams.opportunityId
						}).$promise;
					}
				]
			}
		};
	}

	private editCWUState(): Ng1StateDeclaration {
		return {
			url: '/editcwu',
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
			controller: 'OpportunityEditCWUController',
			controllerAs: 'vm',
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Opportunity: {{ opportunity.name }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private editSWUState(): Ng1StateDeclaration {
		return {
			url: '/editswu',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
			controller: 'OpportunityEditSWUController',
			controllerAs: 'vm',
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'Opportunity: {{ opportunity.name }}'
			},
			ncyBreadcrumb: {
				label: 'Edit Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private createCWUState(): Ng1StateDeclaration {
		return {
			url: '/createcwu',
			templateUrl: '/modules/opportunities/client/views/cwu-opportunity-edit.html',
			controller: 'OpportunityEditCWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'OpportunitiesService',
					(OpportunitiesService: IOpportunitiesService): IOpportunityResource => {
						return new OpportunitiesService();
					}
				],
				projects: [
					'ProjectsService',
					async (ProjectsService: any): Promise<IProject[]> => {
						return await ProjectsService.myadmin().$promise;
					}
				],
				editing() {
					return false;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Opportunity'
			},
			ncyBreadcrumb: {
				label: 'New Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private createSWUState(): Ng1StateDeclaration {
		return {
			url: '/createswu',
			templateUrl: '/modules/opportunities/client/views/swu-opportunity-edit.html',
			controller: 'OpportunityEditSWUController',
			controllerAs: 'vm',
			resolve: {
				opportunity: [
					'OpportunitiesService',
					(OpportunitiesService: IOpportunitiesService): IOpportunityResource => {
						return new OpportunitiesService();
					}
				],
				capabilities: [
					'CapabilitiesService',
					async (CapabilitiesService: ICapabilitiesService): Promise<resource.IResourceArray<ICapabilityResource>> => {
						return await CapabilitiesService.query().$promise;
					}
				],
				programs: [
					'ProgramsService',
					async (ProgramsService: any): Promise<IProgram> => {
						return await ProgramsService.myadmin().$promise;
					}
				],
				projects: [
					'ProjectsService',
					async (ProjectsService: any): Promise<IProject> => {
						return await ProjectsService.myadmin().$promise;
					}
				],
				editing() {
					return false;
				}
			},
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Opportunity'
			},
			ncyBreadcrumb: {
				label: 'New Opportunity',
				parent: 'opportunities.list'
			}
		};
	}

	private createLandingState(): Ng1StateDeclaration {
		return {
			url: '/createlanding',
			templateUrl: '/modules/opportunities/client/views/opportunity-create.html',
			controller: 'OpportunityLandingController',
			controllerAs: 'vm',
			data: {
				roles: ['admin', 'gov'],
				pageTitle: 'New Opportunity'
			},
			ncyBreadcrumb: {
				label: 'New Opportunity',
				parent: 'opportunities.list'
			}
		};
	}
}

angular.module('opportunities.routes').config(['$stateProvider', ($stateProvider: StateProvider) => new OpportunityRouter($stateProvider)]);
