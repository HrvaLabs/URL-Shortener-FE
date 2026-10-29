import { ENTITY_SENTENCE, PUBLISHER_NAME, PUBLISHER_URL } from "@/lib/seo"

export function EntitySentence({ linkClassName }: { linkClassName?: string }) {
  const at = ENTITY_SENTENCE.indexOf(PUBLISHER_NAME)
  if (at < 0) return <>{ENTITY_SENTENCE}</>

  return (
    <>
      {ENTITY_SENTENCE.slice(0, at)}
      <a href={PUBLISHER_URL} className={linkClassName}>
        {PUBLISHER_NAME}
      </a>
      {ENTITY_SENTENCE.slice(at + PUBLISHER_NAME.length)}
    </>
  )
}
