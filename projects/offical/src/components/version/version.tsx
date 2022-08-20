import sm from './version.module.scss'

const Version = ({version}: {version: string}) => {
  return (
    <div className={sm.wrap}>
      <a href="https://github.com/yylive/YYEVA-Web" rel="noreferrer">
        Github YYEVA {version}
      </a>
    </div>
  )
}

export default Version
