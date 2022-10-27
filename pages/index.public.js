import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import { SearchField } from './interface/components/TextField';
import { SelectField } from 'pages/interface/components/Select';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { FaTree } from 'react-icons/fa';

const strategies = [
  { text: 'Relevantes', value: 'relevants', selected: true },
  { text: 'Recentes', value: 'recents' },
  { text: 'Antigos', value: 'old' },
];

const targets = [
  { text: 'Conteúdos', value: 'contents', selected: true },
  { text: 'Usuários', value: 'users', disabled: true },
];

export default function Home({ contentListFound, pagination }) {
  return (
    <>
      <DefaultLayout>
        <div
          css={{
            justifyContent: 'space-between',
            width: 'fill-available',
            alignItems: 'center',
            marginBottom: '15px',
            display: 'flex',
          }}>
          <SearchField placeholder="Pesquisar" />
          <SelectField options={targets} />
          <SelectField options={strategies} />
        </div>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath="/pagina"
          revalidatePath="/api/v1/contents?strategy=relevant"
          emptyStateProps={{
            title: 'Nenhum conteúdo encontrado',
            description: 'Quando eu cheguei era tudo mato...',
            icon: FaTree,
          }}></ContentList>
      </DefaultLayout>
    </>
  );
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();

  context.params = context.params ? context.params : {};

  try {
    context.params = validator(context.params, {
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const results = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      pagination: results.pagination,
    },
    revalidate: 1,
  };
}
