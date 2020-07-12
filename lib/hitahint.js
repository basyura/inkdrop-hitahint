'use babel';

import HitahintMessageDialog from './hitahint-message-dialog';

module.exports = {

  activate() {
    inkdrop.components.registerClass(HitahintMessageDialog);
    inkdrop.layouts.addComponentToLayout(
      'modal',
      'HitahintMessageDialog'
    )
  },

  deactivate() {
    inkdrop.layouts.removeComponentFromLayout(
      'modal',
      'HitahintMessageDialog'
    )
    inkdrop.components.deleteClass(HitahintMessageDialog);
  }

};
