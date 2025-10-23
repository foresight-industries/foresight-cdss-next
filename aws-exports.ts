import { ResourcesConfig } from 'aws-amplify';

const config: ResourcesConfig =  {
    API: {
        GraphQL: {
          endpoint: 'https://zr5rmdwuxzagtbfxlaujosnpda.appsync-api.us-east-1.amazonaws.com/graphql',
          region: 'us-east-1',
          defaultAuthMode: 'oidc',
        }
    }
};

export default config;
