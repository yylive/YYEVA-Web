import {Form, Button} from 'antd'
const PreviewExtendForm = ({replayMp4}: {replayMp4: any}) => {
  return (
    <Form>
      <Form.Item label="effect">
        <div className="effectBlockStyle" id="effect_block"></div>
        <Button
          onClick={() => {
            replayMp4()
          }}
        >
          提交effect
        </Button>
        <textarea className="textareaStyle" id="effect_show"></textarea>
      </Form.Item>
      <Form.Item label="descript">
        <textarea className="textareaStyle" id="descript_show"></textarea>
      </Form.Item>
      <Form.Item label="datas">
        <textarea className="textareaStyle" id="datas_show"></textarea>
      </Form.Item>
    </Form>
  )
}

export default PreviewExtendForm

// <div className="ExtendForm" id="extend_form">
//       <table className="ExtendFormTable">
//         <tbody>
//           <tr>
//             <td width="100" valign="top">
//               effect
//             </td>
//             <td>
//               <div className="effectBlockStyle" id="effect_block"></div>
//               <input
//                 onClick={() => {
//                   replayMp4()
//                 }}
//                 className="effectSubmitStyle"
//                 type="button"
//                 value="提交effect"
//               />
//               <textarea className="textareaStyle" id="effect_show"></textarea>
//             </td>
//           </tr>
//           <tr>
//             <td valign="top">descript</td>
//             <td>
//               <textarea className="textareaStyle" id="descript_show"></textarea>
//             </td>
//           </tr>
//           <tr>
//             <td valign="top">datas</td>
//             <td>
//               <textarea className="textareaStyle" id="datas_show"></textarea>
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
