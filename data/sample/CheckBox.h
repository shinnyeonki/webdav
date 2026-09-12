#pragma once
#include "AbstractButton.h"
class CheckBox : public AbstractButton
{
public:
	CheckBox();
	CheckBox(string name);
	void drawCheck(HDC);
	void repaint(HDC dc) override;
	bool eventHandler(ActionEvent) override;
protected:
	bool isChecked_;
	//int checkBoxType_;
};
