#include "CheckBox.h"
#include "ActionListener.h"
#include "frame.h"
CheckBox::CheckBox(){}
CheckBox::CheckBox(string name) : AbstractButton(name), isChecked_(false) {}

bool CheckBox::eventHandler(ActionEvent e)
{
	if (includes(e.getPoint()))
	{
		if (e.isLButtonUpEvent())
		{
			e.setEventBtnType(this);
			listener_->actionPerformed(e);
			isChecked_ = !isChecked_;
			drawCheck(e.getFrame()->getHDC());
		}
		return true;
	}
	return false;
}

void CheckBox::repaint(HDC dc)
{
	AbstractButton::repaint(dc);
	drawCheck(dc);
}

void CheckBox::drawCheck(HDC dc)
{
	if (isChecked_)
	{
		TextOutA(dc, posx + 10, 30, "[V]", 3);
	}
	else
	{
		TextOutA(dc, posx + 10, 30, "[  ]", 4);
	}
}