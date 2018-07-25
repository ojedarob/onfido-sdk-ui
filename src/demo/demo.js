console.log("demo.js")
import { h, render, Component } from 'preact'
/*
Importing index.js would work, but it would mean we would be bundling all that code into this demo bundle. Therefore we wouldn't be testing as
close to production as with this approach. This approach will actually
use the onfido bundle, the one that clients will use as well.
 */
const Onfido = window.Onfido

const options = window.location
                      .search.slice(1)
                      .split('&')
                      .reduce((/*Object*/ a, /*String*/ b) => {
                        b = b.split('=');
                        a[b[0]] = decodeURIComponent(b[1]);
                        return a;
                      }, {});
const useModal = options.useModal === "true"

const steps = [
  'welcome',
  {
    type:'document',
    options: {
      useWebcam: options.useWebcam === "true",
      documentTypes: {}
    }
  },
  {
    type: 'face',
    options:{
      liveness: options.liveness === "true",
      useWebcam: options.useWebcam !== "false",
    }
  },
  'complete'
]

const language = options.language === "customTranslations" ? {
  locale: 'fr',
  phrases: {'welcome.title': 'Ouvrez votre nouveau compte bancaire'}
} : options.language

const getToken = function(onSuccess) {
  const url = process.env.JWT_FACTORY
  const request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      const data = JSON.parse(request.responseText)
      // Only log the applicant ID in development - it is sensitive data
      console.log("Applicant ID: " + data.applicant_id)
      onSuccess(data.message)
    }
  }
  request.send()
}


class SDK extends Component{
  componentDidMount () {
    this.initSDK(this.props.options)
  }

  componentWillReceiveProps({options}){
    if (this.state.onfidoSdk){
      this.state.onfidoSdk.setOptions(options)
    }
  }

  componentWillUnmount () {
    if (this.state.onfidoSdk) this.state.onfidoSdk.tearDown()
  }

  initSDK = (options)=> {
    const onfidoSdk = Onfido.init(options)
    this.setState({onfidoSdk})
  }

  shouldComponentUpdate () {
    return false
  }

  render () {
    return <div id="onfido-mount"></div>
  }
}

class Demo extends Component{
  constructor (props) {
    super(props)
    getToken((token)=> {
      this.setState({token})
    })
  }

  state = {
    token: null,
    isModalOpen: false
  }

  sdkOptions = ()=> ({
    token: this.state.token,
    useModal,
    onComplete: () => {
      /*callback for when */ console.log("everything is complete")
    },
    isModalOpen: this.state.isModalOpen,
    language,
    steps,
    mobileFlow: !!options.link_id,
    onModalRequestClose: () => {
      this.setState({isModalOpen: false})
    }
  })

  render = () => (
    <div class="container">
      { useModal &&
        <button
          id="button"
          onClick={ () => this.setState({isModalOpen: true})}>
            Verify identity
        </button>
      }
      {options.async === "false" && this.state.token === null?
        <span/> : <SDK options={this.sdkOptions()}></SDK>
      }
    </div>
  )
}


render(<Demo/>, document.getElementById("demo-app") )
