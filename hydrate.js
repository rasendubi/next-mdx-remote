import React, { useMemo, useState } from 'react'
import { mdx } from '@mdx-js/react'

export default function hydrate({ source, renderedOutput }, components) {
  const [hydrated, setHydrated] = useState(false)

  // our default result is the server-rendered output
  // we get this in front of users as quickly as possible
  const [result, setResult] = useState(
    <span dangerouslySetInnerHTML={{ __html: renderedOutput }} />
  )

  // if we're on the client side and have not yet hydrated, we hydrate
  // the mdx content inside requestIdleCallback, since we can be fairly
  // confident that markdown-embedded components are not a high priority
  // to get to interactive compared to... anything else on the page.
  //
  // once the hydration is complete, we update the state/memo value and
  // react re-renders for us
  typeof window !== 'undefined' &&
    !hydrated &&
    window.requestIdleCallback(() => {
      // first we set up the scope which has to include the mdx custom
      // create element function as well as any components we're using
      const scope = { mdx, ...components }
      const keys = Object.keys(scope)
      const values = Object.values(scope)

      // now we eval the source code using a function constructor
      // in order for this to work we need to have React, the mdx createElement,
      // and all our components in scope for the function, which is the case here
      // we pass the names (via keys) in as the function's args, and execute the
      // function with the actual values.
      const hydratedFn = new Function(
        'React',
        ...keys,
        `${source}
        return React.createElement(MDXContent, {});`
      )(React, ...values)

      // finally, we flip the hydrated status so this doesn't run again, and set
      // the output as the new result so that
      setHydrated(true)
      setResult(hydratedFn)
    })

  return useMemo(() => result, [source, result])
}
